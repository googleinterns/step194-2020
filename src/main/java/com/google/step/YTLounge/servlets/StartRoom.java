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
@WebServlet("/startRoom")
public class StartRoom extends HttpServlet {

  //framework, still a work in progress
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
      Gson gson = new Gson();
      response.setContentType("application/json");

    //   response.sendRedirect("/?roomid=" + roomid); //go to main page but with room id
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
}
