// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.step.YTLounge.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Entity;
import com.google.gson.Gson;
import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Servlet that handles searches. */
@WebServlet("/PlaybackInfo")
public class PlaybackCalls extends HttpServlet {
  private Key videoKey; // Key to the datastore PlaybackInfo entity
  private int NUM_VIEWERS = 2; // Number of viewers watching video
  private double FETCH_PERIOD = 1.5; // time between fetch calls

  /** A YouTube video's data and relevant information */
  private static class PlaybackInfo {
    private double timestamp; 
    private boolean isPlaying; 
    private double videoSpeed; 

    public PlaybackInfo() {
      timestamp = 0; 
      isPlaying = false; 
      videoSpeed = 1; 
    }

    public void setTimestamp (double timestamp) {
      this.timestamp = timestamp;
    }

    public void setIsPlaying (boolean isPlaying) {
      this.isPlaying = isPlaying;
    }

    public void setVideoSpeed (double videoSpeed) {
      this.videoSpeed = videoSpeed;
    }
  }

  // Called when users pause, play, seek, or change playback speed
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity newVideo = null; 
    if (videoKey != null) { // A video has been started and stored
      try {
        newVideo = datastore.get(videoKey);
      } catch (Exception e) {
        e.printStackTrace();
      }
      newVideo.setProperty("Timestamp", getTimestamp(request));
      newVideo.setProperty("isPlaying", getIsPlaying(request));
      newVideo.setProperty("videoSpeed", getVideoSpeed(request));
    } else { // This is a new video which needs to be stored
      newVideo = new Entity("Video");
      newVideo.setProperty("Timestamp", 0.0);
      newVideo.setProperty("isPlaying", true);
      newVideo.setProperty("videoSpeed", 1.0);
      videoKey = newVideo.getKey(); 
    }
    datastore.put(newVideo);
    response.sendRedirect("/index.html");
  }

  // Called once per fetch period for each client, sends updated video information
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity entity = null;
    try {
      entity = datastore.get(videoKey);
    } catch (Exception e) {
      e.printStackTrace();
    }
    double timestamp = (double) entity.getProperty("Timestamp");
    boolean isPlaying = (boolean) entity.getProperty("isPlaying");
    double videoSpeed = (double) entity.getProperty("videoSpeed");
    PlaybackInfo vid = new PlaybackInfo();
    vid.setVideoSpeed(videoSpeed); 
    vid.setIsPlaying(isPlaying); 
    if (isPlaying) { // Only change the timestamp if the video is playing
      timestamp += (FETCH_PERIOD / NUM_VIEWERS) * videoSpeed; 
      entity.setProperty("Timestamp", timestamp);
      datastore.put(entity);
    }  
    vid.setTimestamp(timestamp); 
    response.setContentType("application/json;");
    response.getWriter().println(convertToJsonUsingGson(vid));
  }

  private boolean getIsPlaying(HttpServletRequest request) {
    String isPlayingString = request.getParameter("isPlaying"); 
    return (isPlayingString.equals("true")); 
  }

  private double getTimestamp(HttpServletRequest request) {
    String timestampString = request.getParameter("timestamp"); 
    return Double.parseDouble(timestampString);
  }

  private double getVideoSpeed(HttpServletRequest request) {
    String videoSpeedString = request.getParameter("videoSpeed"); 
    return Double.parseDouble(videoSpeedString); 
  }

  private String convertToJsonUsingGson(PlaybackInfo input) {
    Gson gson = new Gson();
    String json = gson.toJson(input);
    return json;
  }
}
