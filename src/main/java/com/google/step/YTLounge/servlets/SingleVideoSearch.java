package com.google.step.YTLounge.servlets;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query.*;
import com.google.appengine.api.datastore.Query;

import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.VideoListResponse;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Collection;
import java.lang.Integer;
import java.util.HashSet;

import javax.servlet.*;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Returns a YouTube video based on a user's inputted YouTube URL */
@WebServlet("/vSearch")
public class SingleVideoSearch extends HttpServlet {

  private static final String CLIENT_SECRETS= "client_secret.json";
  private static final Collection<String> SCOPES =
      Arrays.asList("https://www.googleapis.com/auth/youtube.readonly");

  private static final String APPLICATION_NAME = "YouTube Lounge";
  private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

  /**
    * Create an authorized Credential object.
    *
    * @return an authorized Credential object.
    * @throws IOException
    */
  public static Credential authorize(final NetHttpTransport httpTransport) throws IOException {
      // Load client secrets.
      // ServletContext context = getContext();
      // String fullPath = context.getRealPath("/java/com/google/step/YTLounge/servlets/client_secret.json");
      InputStream in = SingleVideoSearch.class.getResourceAsStream("/WEB-INF/client_secret.json");
      System.err.println(in);
      GoogleClientSecrets clientSecrets =
        GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));
      // Build flow and trigger user authorization request.
      GoogleAuthorizationCodeFlow flow =
          new GoogleAuthorizationCodeFlow.Builder(httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
          .build();
      Credential credential =
          new AuthorizationCodeInstalledApp(flow, new LocalServerReceiver()).authorize("user");
      return credential;
  }

  /**
    * Build and return an authorized API client service.
    *
    * @return an authorized API client service
    * @throws GeneralSecurityException, IOException
    */
  public static YouTube getService() throws GeneralSecurityException, IOException {
      final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
      Credential credential = authorize(httpTransport);
      return new YouTube.Builder(httpTransport, JSON_FACTORY, credential)
          .setApplicationName("YouTube Lounge")
          .build();
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) 
    throws IOException {
    //accesses YouTube API to get a specific video as long as the given URL is valid
    Gson gson = new Gson();
    response.setContentType("application/json");
    String videoID = getParameter(request, "id", "");
    // String roomid = getParameter(request, "roomid", "");

    YouTube youtubeService = null;
    try {
      youtubeService = getService();
    } catch (GeneralSecurityException e) {
      response.getWriter().println("");
    }
    if (youtubeService == null) {
      return;
    }
    YouTube.Videos.List videoRequest = youtubeService.videos()
      .list("snippet,contentDetails");
    VideoListResponse videoResponse = videoRequest.setId(videoID).execute();
    JsonObject jsonObject = new JsonParser().parse(gson.toJson(videoResponse)).getAsJsonObject();
    JsonObject error = jsonObject.getAsJsonObject("error");
    if (error == null) { //if video doesn't exist
      return;
    }

    extractVideo(jsonObject.getAsJsonArray("items"));

    response.getWriter().println(gson.toJson(videoResponse));
  }

  /**
    * If a room wasn't found from the query, create a new room ID
    * while respecting the current IDs in DataStore. Initializes
    * necessary properties for the room.
    * @return a string representing a room's identifier
    */
  // private String generateRoomID() {
  //   DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
  //   Key roomKey = datastore.newKeyFactory()
  //     .setKind("room");
  //   Entity roomEntity = Entity.newBuilder(roomKey)
  //     .set("members", new HashSet<Key<Member>>())
  //     .set("nowPlaying", "")
  //     .set("queue", new List<Key<Video>>())
  //     .set("duration", 0)
  //     .set("elapsedTime", 0)
  //     .set("log", new List<Key<Chat>>())
  //     .build();
  //   datastore.put(roomEntity);
  //   return datastore.get(roomKey).id();
  // }

  /**
    * Iterates through the given items and locates specific values to 
    * create a new Video and upload the video to DataStore
    */
  private void extractVideo(JsonArray items) {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity videoEntity = new Entity("Video");
    for (int i = 0; i < items.size(); i++) {
      JsonObject snippet = items.get(i).getAsJsonObject().getAsJsonObject("snippet");
      String title = snippet.get("title").getAsString();
      String thumbnailURL = snippet.getAsJsonObject("thumbnails").getAsJsonObject("medium").get(
        "url").getAsString();
      // String formattedVideoURL = "https://youtube.com/watch?v=" + videoID;
      String duration = snippet.getAsJsonObject("contentDetails").get("duration").getAsString();
      String channelName = snippet.get("channelTitle").getAsString();
      String releaseDate = snippet.get("publishedAt").getAsString();
      
      videoEntity.setProperty("title", title);
      videoEntity.setProperty("thumbnailURL", thumbnailURL);
      // videoEntity.setProperty("videoURL", formattedVideoURL);
      // videoEntity.setProperty("videoID", videoID);
      videoEntity.setProperty("duration", parseDuration(duration));
      videoEntity.setProperty("channelName", channelName);
      videoEntity.setProperty("releaseDate", releaseDate);
      videoEntity.setProperty("requestTime", System.currentTimeMillis());
      datastore.put(videoEntity); //place video in queue for that room
    }
  }

  /**
    * Takes the given string and converts it into pure seconds.
    * String must be either in the format of "PT#H#M#S" or
    * "PT#M#S" to be properly parsed.
    *
    * @return a long for the number of seconds in encodedTime
    */
  private long parseDuration(String encodedTime) {
    String shortenedTime = encodedTime.substring(2);
    long hours = 0;
    long minutes = 0;
    long seconds = 0;
    if (shortenedTime.contains("H")) {
        hours = Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("H")));
        seconds += (hours * 3600);
        shortenedTime = shortenedTime.substring(shortenedTime.indexOf("H") + 1);
    }
    minutes = Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("M")));
    seconds += (minutes * 60);
    shortenedTime = shortenedTime.substring(shortenedTime.indexOf("M") + 1);
    seconds += Integer.parseInt(shortenedTime);

    return seconds;
  }

  /**
    * Locates the name parameter in the given request and
    * returns that value.
    *
    * @return defaultValue if name parameter wasn't found
    * @return found value for name parameter
    */
  private String getParameter(HttpServletRequest request, String name, String defaultValue) {
    String value = request.getParameter(name);
    if (value == null) {
      return defaultValue;
    }
    return value;
  }
}
