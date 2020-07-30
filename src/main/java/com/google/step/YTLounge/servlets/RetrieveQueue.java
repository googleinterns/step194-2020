package com.google.step.YTLounge.servlets;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Query.Direction;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Accesses all videos in the firestore queue */
@WebServlet("/queueRefresh")
public class RetrieveQueue extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Gson gson = new Gson();
    response.setContentType("application/json");
    String roomid = getParameter(request, "roomid", "");
    if (roomid.equals("")) {
      response.getWriter().println(gson.toJson("error: no room found"));
    }
    Firestore db = null;
    try {
      db = authorize();
    } catch (Exception e) {
      System.out.println("bad firestore authorization");
    }
    DocumentReference roomRef = db.collection("rooms").document(roomid);
    ApiFuture<DocumentSnapshot> roomFuture = roomRef.get();
    DocumentSnapshot room = null;
    try {
      room = roomFuture.get();
    } catch (Exception e) {
      response.getWriter().println(gson.toJson("error: DocSnap error"));
    }
    if (room.exists()) {
      ApiFuture<QuerySnapshot> queueFuture = 
          db.collection("rooms")
              .document(roomid)
              .collection("information")
              .document("queue")
              .collection("videos")
              .orderBy("requestTime", Direction.ASCENDING)
              .get(); // sort all videos for this room by their requestTime
              
      List<QueryDocumentSnapshot> queueVideos = null;
      List<Object> queueFormatted = new ArrayList<>();
      try {
        queueVideos = queueFuture.get().getDocuments();
        for (QueryDocumentSnapshot doc : queueVideos) {
          queueFormatted.add(doc.getData());
        }
      } catch (Exception e) {
        response.getWriter().println(gson.toJson("error: DocSnap error"));
      }
      response.getWriter().println(gson.toJson(queueFormatted));
    } else {
      response.getWriter().println(gson.toJson("error: room does not exist"));
    }
    try {
      db.close();
    } catch (Exception e) {
      response.getWriter().println(gson.toJson("error: db never opened"));
    }
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
   * Retrieves validation for Firestore access.
   *
   * @return null if access denied
   * @return Validated Firestore object
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
