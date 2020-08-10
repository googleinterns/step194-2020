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

import com.google.sps.MockSVS;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/** */
@RunWith(JUnit4.class)
public final class SingleVideoSearchTest {
  private MockSVS search;
  private HttpServletRequest request;
  private HttpServletResponse response;

  @Before
  public void setUp() {
    search = new MockSVS();
    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);
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

//   @Test
//   public void testVideo() throws Exception {
//     System.out.println(new File(".").getAbsoluteFile());
//     when(request.getParameter("room_id")).thenReturn("testOneSearch");
//     when(request.getParameter("id")).thenReturn("JeUFrZtKkn8");
//     StringWriter stringWriter = new StringWriter();
//     PrintWriter writer = new PrintWriter(stringWriter);
//     when(response.getWriter()).thenReturn(writer);

//     servlet.doGet(request, response);
//     Assert.assertTrue(stringWriter.toString().contains("\"etag\":\"jWEsonyluP7Tb3eDB0m6tV_RQ5g\""));
//   }

//   @Test
//   public void testFakeVideo() throws Exception {
//     when(request.getParameter("room_id")).thenReturn("testOneSearch");
//     when(request.getParameter("id")).thenReturn("1");
//     StringWriter stringWriter = new StringWriter();
//     PrintWriter writer = new PrintWriter(stringWriter);
//     when(response.getWriter()).thenReturn(writer);

//     servlet.doGet(request, response);
//     Assert.assertTrue(stringWriter.toString().contains("\"resultsPerPage\":0,\"totalResults\":0"));
//   }

//   @Test
//   public void testNoRoom() throws Exception {
//     when(request.getParameter("room_id")).thenReturn("");
//     when(request.getParameter("id")).thenReturn("JeUFrZtKkn8");
//     StringWriter stringWriter = new StringWriter();
//     PrintWriter writer = new PrintWriter(stringWriter);
//     when(response.getWriter()).thenReturn(writer);

//     servlet.doGet(request, response);
//     Assert.assertTrue(stringWriter.toString().contains("error: no room found"));
//   }
}
