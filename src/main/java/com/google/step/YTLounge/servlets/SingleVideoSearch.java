package com.google.step.YTLounge.servlets;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.YouTubeRequestInitializer;
import com.google.api.services.youtube.model.VideoListResponse;
import com.google.appengine.api.datastore.*;
import com.google.cloud.firestore.DocumentReference;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Returns a YouTube video based on a user's inputted YouTube URL */
@WebServlet("/vSearch")
public class SingleVideoSearch extends HttpServlet {
  private static final JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();

  /**
   * Build and return an authorized API client service.
   *
   * @return an authorized API client service
   * @throws GeneralSecurityException, IOException
   */
  public YouTube getService() throws GeneralSecurityException, IOException {
    String key = readSecrets();
    final YouTubeRequestInitializer keyInitializer = new YouTubeRequestInitializer(key);
    final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    return new YouTube.Builder(httpTransport, jsonFactory, null)
        .setApplicationName("YouTube Lounge")
        .setYouTubeRequestInitializer(keyInitializer)
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
    // accesses YouTube API to get a specific video as long as the given URL is valid
    Gson gson = new Gson();
    response.setContentType("application/json");
    String videoID = getParameter(request, "id", "");
    String roomID = getParameter(request, "roomid", "");
    if (roomID.equals("")) {
        roomID = generateRoomID();
    }

    YouTube youtubeService = null;
    try {
      youtubeService = getService();
    } catch (GeneralSecurityException e) {
      response.getWriter().println("");
      return;
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

    try {
        extractVideo(jsonObject.getAsJsonArray("items"), videoID, roomID);
        response.getWriter().println(gson.toJson(videoResponse));
    } catch (Exception e) {
        response.getWriter().println(gson.toJson("error: exception"));
    }
  }

  /**
   * If a room wasn't found from the query, create a new room ID while respecting the current IDs in
   * DataStore. Initializes necessary properties for the room.
   *
   * @return a string representing a room's identifier
   */
  private String generateRoomID() {
    Firestore db = null;
    try {
      db = authorize();
    } catch (Exception e) {
      System.out.println("bad firestore authorization");
    }
    Map<String, Object> roomData = new HashMap<>();
    roomData.put("members", new HashMap<>());
    roomData.put("nowPlaying", null);
    roomData.put("queue", null);
    roomData.put("duration", 0);
    roomData.put("elapsedTime", 0);
    roomData.put("log", null);
    ApiFuture<DocumentReference> addedDocRef = db.collection("rooms").add(roomData);
    String id = null;
    try {
      id = addedDocRef.get().getId();
      System.out.println("Added document with ID: " + id);
      db.close();
      return id;
    } catch (Exception e) {
      System.out.println("UNABLE to get id");
    }
    
    return "";
  }

  /**
   * Iterates through the given items and locates specific values to create a new Video and upload
   * the video to DataStore
   */
  private void extractVideo(JsonArray items, String videoID, String roomID) throws Exception {
    Firestore db = null;
    try {
      db = authorize();
    } catch (Exception e) {
      System.out.println("bad firestore authorization");
    }
    ApiFuture<QuerySnapshot> queueFuture =
        db
            .collection("rooms")
            .document(roomID)
            .collection("information")
            .document("queue")
            .collection("videos")
            .get(); // get all videos in the room's queue
    List<QueryDocumentSnapshot> queueVideos = queueFuture.get().getDocuments();
    DocumentReference docRef = 
        db
            .collection("rooms")
            .document(roomID)
            .collection("information")
            .document("queue")
            .collection("videos")
            .document("video" + queueVideos.size()); // create new video instance in queue
    ApiFuture<DocumentSnapshot> future = docRef.get();
    DocumentSnapshot document = future.get();
    Map<String, Object> videoData = new HashMap<>();
    findItems(items, videoData, docRef, videoID);// might change method name
    db.close();
  }

  /**
   * Iterates through the given items and adds the relevant information to 
   * the given map, eventually adding the video to the database and notifying
   * the console of when the item was successfully added
   */
  private void findItems(JsonArray items, Map<String, Object> videoData,
      DocumentReference docRef, String videoID) {
    for (int i = 0; i < items.size(); i++) {
      JsonObject snippet = items.get(i).getAsJsonObject().getAsJsonObject("snippet");
      String thumbnailURL =
          snippet.getAsJsonObject("thumbnails").getAsJsonObject("medium").get("url").toString();
      String title = snippet.get("title").toString();
      String duration =
          items
              .get(i)
              .getAsJsonObject()
              .getAsJsonObject("contentDetails")
              .get("duration")
              .toString();
      duration = duration.substring(1, duration.length() - 1);
      long numberDuration = parseDuration(duration);
      String formattedVideoURL = "https://youtube.com/watch?v=" + videoID;
      String channelName = snippet.get("channelTitle").toString();
      String releaseDate = snippet.get("publishedAt").toString();
      try {
        videoData.put("title", title);
        videoData.put("thumbnailURL", thumbnailURL);
        videoData.put("videoURL", formattedVideoURL);
        videoData.put("videoID", videoID);
        videoData.put("duration", numberDuration);
        videoData.put("channelName", channelName);
        videoData.put("releaseDate", releaseDate);
        videoData.put("requestTime", System.currentTimeMillis());
        ApiFuture<WriteResult> result = docRef.set(videoData);
        System.out.println("Update time : " + result.get().getUpdateTime());
      } catch (Exception e) {
          System.out.println("Error: can't put video into firestore");
      }
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
    shortenedTime =
        shortenedTime.substring(shortenedTime.indexOf("M") + 1, shortenedTime.length() - 1);
    seconds += Integer.parseInt(shortenedTime);

    return seconds;
  }

  /**
   * Locates the name parameter in the given request and returns that value.
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

  /**
   * Creates a Firestore that's available for reading and writing data to the database.
   */
  private Firestore authorize() throws Exception {
    Firestore db = null;
    try {
      GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();
      FirestoreOptions firestoreOptions =
          FirestoreOptions.getDefaultInstance().toBuilder()
              .setProjectId("youtube-lounge")
              .setCredentials(GoogleCredentials.getApplicationDefault())
              .build();
      db = firestoreOptions.getService();
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
      return db;
    }
  }

  /**
   * Locate the necessary API key to access needed data
   */
  private String readSecrets() {
    try {
      File secretFile = new File("dataSecret.txt");
      Scanner myReader = new Scanner(secretFile);
      if (myReader.hasNextLine()) {
        String data = myReader.nextLine();
        return data;
      }
      myReader.close();
    } catch (Exception e) {
      System.out.println("An error occurred.");
      e.printStackTrace();
    }
    return "";
  }
}
