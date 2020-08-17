package com.google.step.YTLounge.servlets;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.core.ApiFuture;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.YouTubeRequestInitializer;
import com.google.api.services.youtube.model.SearchListResponse;
import com.google.gson.Gson;
import com.google.step.YTLounge.data.RequestParameter;
import java.io.File;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Scanner;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/keywordSearch")
public class KeywordSearch extends HttpServlet {
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

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Gson gson = new Gson();
    response.setContentType("application/json");
    String keywords = RequestParameter.getParameter(request, "words", "");
    YouTube youtubeService = null;
    try {
      youtubeService = getService();
    } catch (Exception e) {
      e.printStackTrace();
    }
    if (youtubeService == null) {
      return;
    }
    // Define and execute the API request
    YouTube.Search.List vidRequest = youtubeService.search().list("snippet");
    SearchListResponse vidResponse =
        vidRequest.setMaxResults(15L).setQ(keywords).setType("video").execute();
    response.getWriter().println(gson.toJson(vidResponse));
  }

  /**
   * Takes the given string and converts it into pure seconds. String must be either in the format
   * of "PT#H#M#S" or "PT#M#S" to be properly parsed.
   *
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

  /** Locate the necessary API key to access needed data */
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
