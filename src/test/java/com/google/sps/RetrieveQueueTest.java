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

import com.google.step.YTLounge.data.Video;
import java.io.*;
import java.util.Map;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** */
@RunWith(JUnit4.class)
public final class RetrieveQueueTest {
  private MockRQ queue;
  private Video vid1;
  private Video vid2;

  @Before
  public void setUp() {
    queue = new MockRQ();
    vid1 = new Video(
      "FTC", 
      "https://i.ytimg.com/vi/9IVO5Dsz1KI/mqdefault.jpg",
      "https://youtube.com/watch?v=9IVO5Dsz1KI",
      112);
    vid2 = new Video(
      "Meet UX Designers at Google",
      "https://i.ytimg.com/vi/116sMd5U7UY/sddefault.jpg",
      "https://youtube.com/watch?v=116sMd5U7UY",
      136);
  }

  @Test
  public void testRealRoomOneVideo() throws Exception {
    Map<String, Video> result = queue.mockGet("100");
    Assert.assertTrue(result.get("video1").getTitle().equals("FTC"));
    Assert.assertTrue(result.get("video1").getThumbnail()
        .equals("https://i.ytimg.com/vi/9IVO5Dsz1KI/mqdefault.jpg"));
    Assert.assertTrue(result.get("video1").getVideoURL()
        .equals("https://youtube.com/watch?v=9IVO5Dsz1KI"));
    Assert.assertTrue(result.get("video1").getDuration() == 112);
  }

  @Test
  public void testRealRoomTwoVideos() throws Exception {
    Map<String, Video> result = queue.mockGet("101");
    Assert.assertTrue(result.get("video1").getTitle().equals("FTC"));
    Assert.assertTrue(result.get("video1").getThumbnail()
        .equals("https://i.ytimg.com/vi/9IVO5Dsz1KI/mqdefault.jpg"));
    Assert.assertTrue(result.get("video1").getVideoURL()
        .equals("https://youtube.com/watch?v=9IVO5Dsz1KI"));
    Assert.assertTrue(result.get("video1").getDuration() == 112);
    Assert.assertTrue(result.get("video2").getTitle().equals("Meet UX Designers at Google"));
    Assert.assertTrue(result.get("video2").getThumbnail()
        .equals("https://i.ytimg.com/vi/116sMd5U7UY/sddefault.jpg"));
    Assert.assertTrue(result.get("video2").getVideoURL()
        .equals("https://youtube.com/watch?v=116sMd5U7UY"));
    Assert.assertTrue(result.get("video2").getDuration() == 136);
    Assert.assertTrue(result.size() == 2);
  }

  @Test
  public void testFakeRoom() throws Exception {
    Map<String, Video> result = queue.mockGet("bad room");
    Assert.assertTrue(result == null);
  }
}
