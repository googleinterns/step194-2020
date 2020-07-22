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
import com.google.api.client.googleapis.services.CommonGoogleClientRequestInitializer;
import com.google.api.client.googleapis.services.json.CommonGoogleJsonClientRequestInitializer;
import com.google.api.services.youtube.YouTubeRequestInitializer;
import com.google.api.client.googleapis.services.GoogleClientRequestInitializer;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.appengine.api.datastore.*;
import com.google.cloud.datastore.Datastore;
import com.google.cloud.datastore.DatastoreOptions;
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
import java.util.List;
import java.util.ArrayList;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Returns a YouTube video based on a user's inputted YouTube URL */
@WebServlet("/vSearch")
public class SingleVideoSearch extends HttpServlet {

  private static final String CLIENT_SECRETS= 
    "~/step194-2020/src/main/java/com/google/step/YTLoung/servlets/client_secret.json";
  private static final Collection<String> SCOPES =
      Arrays.asList("https://www.googleapis.com/auth/youtube.readonly");
  private static final String APPLICATION_NAME = "YouTube Lounge";
  private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

  /**
   * Build and return an authorized API client service.
   *
   * @return an authorized API client service
   * @throws GeneralSecurityException, IOException
   */
  public YouTube getService() throws GeneralSecurityException, IOException {
    final YouTubeRequestInitializer KEY_INITIALIZER =
      new YouTubeRequestInitializer("AIzaSyBIwlgpsYZLoI7cr347HyBoAETX9FvzXps");
    final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    return new YouTube.Builder(httpTransport, JSON_FACTORY, null)
      .setApplicationName("YouTube Lounge")
      .setYouTubeRequestInitializer(KEY_INITIALIZER)
      .build();
  }

  /**
   * Retrieve query parameters, extract the video if video exists, and create new Lounge if
   * necessary based on query request. Prints video response when complete.
   *
   * @throws IOException
   */
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    //accesses YouTube API to get a specific video as long as the given URL is valid
    Gson gson = new Gson();
    response.setContentType("application/json");
    String videoID = getParameter(request, "id", "");
    String roomid = getParameter(request, "roomid", generateRoomID());

    YouTube youtubeService = null;
    try {
      youtubeService = getService();
    } catch (GeneralSecurityException e) {
      response.getWriter().println("");
    }
    if (youtubeService == null) {
      return;
    }
    YouTube.Videos.List videoRequest = youtubeService.videos().list("snippet,contentDetails");
    VideoListResponse videoResponse = videoRequest.setId(videoID).execute();
    JsonObject jsonObject = new JsonParser().parse(gson.toJson(videoResponse)).getAsJsonObject();
    JsonObject error = jsonObject.getAsJsonObject("error");
    if (error != null) { // if video doesn't exist
      return;
    }

    extractVideo(jsonObject.getAsJsonArray("items"), videoID);
    response.getWriter().println(gson.toJson(videoResponse));
  }

  /**
   * If a room wasn't found from the query, create a new room ID while respecting the current IDs in
   * DataStore. Initializes necessary properties for the room.
   *
   * @return a string representing a room's identifier
   */
  private String generateRoomID() {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity roomEntity = new Entity("room");
    roomEntity.setProperty("members", new HashSet<Key>());
    roomEntity.setProperty("nowPlaying", "");
    roomEntity.setProperty("queue", new ArrayList<Key>());
    roomEntity.setProperty("duration", 0);
    roomEntity.setProperty("elapsedTime", 0);
    roomEntity.setProperty("log", new ArrayList<Key>());
    datastore.put(roomEntity);
    return Long.toString(roomEntity.getKey().getId());
  }

  /**
   * Iterates through the given items and locates specific values to 
   * create a new Video and upload the video to DataStore
   */
  private void extractVideo(JsonArray items, String videoID) {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity videoEntity = new Entity("Video");
    for (int i = 0; i < items.size(); i++) {
      JsonObject snippet = items.get(i).getAsJsonObject().getAsJsonObject("snippet");
      String title = snippet.get("title").toString();
      String thumbnailURL = 
          snippet.getAsJsonObject("thumbnails").getAsJsonObject("medium").get("url").toString();
      String formattedVideoURL = "https://youtube.com/watch?v=" + videoID;
      String duration = 
        items
            .get(i)
            .getAsJsonObject()
            .getAsJsonObject("contentDetails")
            .get("duration")
            .toString();
      String channelName = snippet.get("channelTitle").toString();
      String releaseDate = snippet.get("publishedAt").toString();
      
      videoEntity.setProperty("title", title);
      videoEntity.setProperty("thumbnailURL", thumbnailURL);
      videoEntity.setProperty("videoURL", formattedVideoURL);
      videoEntity.setProperty("videoID", videoID);
      videoEntity.setProperty("duration", parseDuration(duration));
      videoEntity.setProperty("channelName", channelName);
      videoEntity.setProperty("releaseDate", releaseDate);
      videoEntity.setProperty("requestTime", System.currentTimeMillis());
      datastore.put(videoEntity); // place video in queue for that room
    }
  }

  /**
   * Takes the given string and converts it into pure seconds. String must be either in the format
   * of "PT#H#M#S" or "PT#M#S" to be properly parsed.
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
