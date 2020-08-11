// Copyright 2019 Google LLC
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

package com.google.sps;

import static org.mockito.Mockito.*;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.*;
import java.util.HashMap;
import java.util.Map;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** */
@RunWith(JUnit4.class)
public final class SingleVideoSearchTest {
  private MockSingleVideoSearch search;
  private Map<String, Object> vData;
  private Gson gson;
  private String REAL_VIDEO =
      "{\"kind\":\"youtube#videoListResponse\",\"etag\":\"YTWhke-BMMIKtBHO_uDWyOtb-XM\","
          + "\"items\":[{\"kind\":\"youtube#video\",\"etag\":\"NME3R8704XZ1NfYPNKrN4jj9aGs\","
          + "\"id\":\"9IVO5Dsz1KI\",\"snippet\":{\"publishedAt\":\"2020-07-30T17:00:22Z\",\"channelId\":\"UCFl7yKfcRcFmIUbKeCA-SJQ\",\"title\":\"FTC\",\"description\":\"NOT"
          + " SONG\","
          + "\"thumbnails\":{\"default\":{\"url\":\"https://i.ytimg.com/vi/9IVO5Dsz1KI/default.jpg\",\"width\":"
          + " 120,\"height\": 90},\"medium\": {\"url\":"
          + " \"https://i.ytimg.com/vi/9IVO5Dsz1KI/mqdefault.jpg\",\"width\": 320,\"height\":"
          + " 180},\"high\": {\"url\":"
          + " \"https://i.ytimg.com/vi/9IVO5Dsz1KI/hqdefault.jpg\",\"width\":"
          + " 480,\"height\":360}},\"channelTitle\":\"Joji\",\"tags\":[\"joji\",\"88rising\",\"ballads"
          + " 1\",\"slow dancing in the dark\",\"run\",\"sanctuary\",\"in tongues\",\"music"
          + " video\",\"official video\",\"will he\",\"midsummer madness\",\"pretty"
          + " boy\",\"nectar\",\"gimme"
          + " love\"],\"categoryId\":\"10\",\"liveBroadcastContent\":\"none\",\"localized\":"
          + " {\"title\": \"FTC\",\"description\": \"NOT SONG\"}},\"contentDetails\": {"
          + "\"duration\":\"PT1M52S\",\"dimension\":\"2d\",\"definition\":\"sd\",\"caption\":\"false\",\"licensedContent\":false,\"contentRating\":"
          + " {},\"projection\": \"rectangular\"},"
          + "\"statistics\":{\"likeCount\":\"117647\",\"dislikeCount\":\"761\","
          + "\"favoriteCount\":\"0\",\"commentCount\":\"8883\"}}],\"pageInfo\":{\"totalResults\":1,"
          + "\"resultsPerPage\":1}}";
  private final String REAL_ID = "9IVO5Dsz1KI";
  private final String FAKE_VIDEO =
      "{\"kind\": \"youtube#videoListResponse\",\"etag\": \"ilEkUQSqfx69LTHRUUhEulatfBk\", "
          + "\"items\": [], \"pageInfo\": {\"totalResults\": 0,\"resultsPerPage\": 0}}";
  private final String FAKE_ID = "1";

  @Before
  public void setUp() {
    search = new MockSingleVideoSearch();
    vData = new HashMap<>();
    gson = new Gson();
  }

  @Test
  public void testMinutesAndSeconds() throws Exception {
    Assert.assertEquals(search.parseDuration("PT3M41S"), 221);
  }

  @Test
  public void testMinutes() throws Exception {
    Assert.assertEquals(search.parseDuration("PT5M"), 300);
  }

  @Test
  public void testSeconds() throws Exception {
    Assert.assertEquals(search.parseDuration("PT20S"), 20);
  }

  @Test
  public void testHours() throws Exception {
    Assert.assertEquals(search.parseDuration("PT2H"), 7200);
  }

  @Test
  public void testHoursAndMinutes() throws Exception {
    Assert.assertEquals(search.parseDuration("PT1H1M"), 3660);
  }

  @Test
  public void testHoursAndSeconds() throws Exception {
    Assert.assertEquals(search.parseDuration("PT1H1S"), 3601);
  }

  @Test
  public void testAllTime() throws Exception {
    Assert.assertEquals(search.parseDuration("PT2H31M9S"), 9069);
  }

  @Test
  public void testRealVideo() throws Exception {
    JsonObject rObj = new JsonParser().parse(REAL_VIDEO).getAsJsonObject();
    JsonArray items = rObj.getAsJsonArray("items");
    Map<String, Object> resultMap = search.getVideoInformation(items, vData, REAL_ID);
    Assert.assertTrue(resultMap.get("title").equals("\"FTC\""));
    Assert.assertTrue(
        resultMap
            .get("thumbnailURL")
            .equals("\"https://i.ytimg.com/vi/9IVO5Dsz1KI/mqdefault.jpg\""));
    Assert.assertTrue(resultMap.get("videoURL").equals("https://youtube.com/watch?v=9IVO5Dsz1KI"));
    Assert.assertTrue(resultMap.get("channelName").equals("\"Joji\""));
  }

  @Test
  public void testFakeVideo() throws Exception {
    JsonObject rObj = new JsonParser().parse(FAKE_VIDEO).getAsJsonObject();
    JsonArray items = rObj.getAsJsonArray("items");
    Map<String, Object> result = search.getVideoInformation(items, vData, FAKE_ID);
    Assert.assertEquals(result, new HashMap<>());
  }
}
