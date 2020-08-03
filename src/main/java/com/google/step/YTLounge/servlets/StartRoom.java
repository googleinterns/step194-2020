package com.google.step.YTLounge.servlets;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Returns a YouTube video based on a user's inputted YouTube URL */
@WebServlet("/startRoom")
public class StartRoom extends HttpServlet {

  // framework, still a work in progress
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Gson gson = new Gson();
    response.setContentType("application/json");
    String roomid = generateRoomID();
    response.sendRedirect("/lounge.html/?roomid=" + roomid);
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

  /** Creates a Firestore that's available for reading and writing data to the database. */
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
}
