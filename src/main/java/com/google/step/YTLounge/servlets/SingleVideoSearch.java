package com.google.step.YTLounge.servlets;

import com.google.api.core.ApiFuture;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.VideoListResponse;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.step.YTLounge.data.FirestoreAuth;
import com.google.step.YTLounge.data.RequestParameter;
import com.google.step.YTLounge.data.YoutubeService;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Returns a YouTube video based on a user's inputted YouTube URL */
@WebServlet("/vSearch")
public class SingleVideoSearch extends HttpServlet {
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
    String videoID = RequestParameter.getParameter(request, "id", "");
    String roomID = RequestParameter.getParameter(request, "room_id", "");
    if (roomID.equals("")) {
      response.getWriter().println(gson.toJson("error: no room found"));
      return;
    }

    YouTube youtubeService = null;
    try {
      youtubeService = YoutubeService.getService();
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
      e.printStackTrace();
      response.getWriter().println(gson.toJson("error: exception"));
    }
  }

  /**
   * Iterates through the given items and locates specific values to create a new Video and upload
   * the video to Firestore
   *
   * @param items the json contents taken from YouTube's API
   * @param videoID the ID of the video that YouTube uses in their hyperlinks/storage
   * @param roomID the room the user is in
   * @throws Exception
   */
  private void extractVideo(JsonArray items, String videoID, String roomID) throws Exception {
    Firestore db = null;
    try {
      db = FirestoreAuth.authorize();
    } catch (Exception e) {
      System.out.println("bad firestore authorization");
    }
    Map<String, Object> videoData = new HashMap<>();
    ApiFuture<DocumentReference> newVideo =
        db.collection("rooms")
            .document(roomID)
            .collection("queue")
            .add(getVideoInformation(items, videoData, videoID)); // add new video
    System.out.println("Added new video with ID: " + newVideo.get().getId());
    db.close();
  }

  /**
   * Iterates through the given items and adds the relevant information to the given map, eventually
   * adding the video to the database and notifying the console of when the item was successfully
   * added
   *
   * @param items the json contents taken from YouTube's API
   * @param videoData the wrapper to place values and properties into
   * @param videoID the ID of the video that YouTube uses in their hyperlinks/storage
   * @return a map of properties to their respective values to be put in firestore
   */
  private Map<String, Object> getVideoInformation(
      JsonArray items, Map<String, Object> videoData, String videoID) {
    for (int i = 0; i < items.size(); i++) {
      JsonObject snippet = items.get(i).getAsJsonObject().getAsJsonObject("snippet");
      JsonObject thumbnails = snippet.getAsJsonObject("thumbnails");
      String thumbnailURL = null; // go through each thumbnail possibility
      if (thumbnails.getAsJsonObject("standard") != null) {
        thumbnailURL = thumbnails.getAsJsonObject("standard").get("url").toString();
      } else if (thumbnails.getAsJsonObject("high") != null) {
        thumbnailURL = thumbnails.getAsJsonObject("high").get("url").toString();
      } else if (thumbnails.getAsJsonObject("medium") != null) {
        thumbnailURL = thumbnails.getAsJsonObject("medium").get("url").toString();
      } else if (thumbnails.getAsJsonObject("default") != null) {
        thumbnailURL = thumbnails.getAsJsonObject("default").get("url").toString();
      }
      String bigThumbnailURL = null;
      if (thumbnails.getAsJsonObject("maxres") != null) {
        bigThumbnailURL =
            snippet.getAsJsonObject("thumbnails").getAsJsonObject("maxres").get("url").toString();
      }
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
        videoData.put("bigThumbnailURL", bigThumbnailURL);
        videoData.put("videoURL", formattedVideoURL);
        videoData.put("videoID", videoID);
        videoData.put("duration", numberDuration);
        videoData.put("channelName", channelName);
        videoData.put("releaseDate", releaseDate);
        videoData.put("requestTime", System.currentTimeMillis());
        return videoData;
      } catch (Exception e) {
        System.out.println("Error: can't put video into firestore");
      }
    }
    return new HashMap<>();
  }

  /**
   * Takes the given string and converts it into pure seconds. String must be either in the format
   * of "PT#H#M#S" or "PT#M#S" to be properly parsed.
   *
   * @param encodedTime a time signature in the form "PT1H15M45S" or "PT3M1S"
   * @return a long for the number of seconds in encodedTime
   */
  public long parseDuration(String encodedTime) {
    String shortenedTime = encodedTime.substring(2);
    long hours = 0;
    long minutes = 0;
    long seconds = 0;
    if (shortenedTime.contains("H")) {
      hours = Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("H")));
      seconds += (hours * 3600);
      shortenedTime = shortenedTime.substring(shortenedTime.indexOf("H") + 1);
    }
    if (shortenedTime.contains("M")) {
      minutes = Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("M")));
      seconds += (minutes * 60);
      shortenedTime = shortenedTime.substring(shortenedTime.indexOf("M") + 1);
    }
    if (shortenedTime.contains("S")) {
      seconds += Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("S")));
    }
    return seconds;
  }
}
