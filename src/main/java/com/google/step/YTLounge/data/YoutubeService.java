package com.google.step.YTLounge.data;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.YouTubeRequestInitializer;
import java.io.File;
import java.io.IOException;
import java.util.Scanner;
import java.security.GeneralSecurityException;

public class YoutubeService {
  private static final JsonFactory jsonFactory = JacksonFactory.getDefaultInstance();

  public YoutubeService(){}

  /**
   * Build and return an authorized API client service.
   *
   * @return an authorized API client service
   * @throws GeneralSecurityException, IOException
   */
  public static YouTube getService() throws GeneralSecurityException, IOException {
    String key = YoutubeService.getAPIKey();
    final YouTubeRequestInitializer keyInitializer = new YouTubeRequestInitializer(key);
    final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    return new YouTube.Builder(httpTransport, jsonFactory, null)
        .setApplicationName("YouTube Lounge")
        .setYouTubeRequestInitializer(keyInitializer)
        .build();
  }

  /** Locate the necessary API key to access needed data */
  private static String getAPIKey() {
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
