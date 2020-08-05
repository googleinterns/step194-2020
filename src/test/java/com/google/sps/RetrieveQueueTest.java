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

import com.google.step.YTLounge.servlets.RetrieveQueue;
import java.io.*;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import static org.mockito.Mockito.*;
import org.mockito.Mock;
import org.mockito.InjectMocks;

/** */
@RunWith(JUnit4.class)
public final class RetrieveQueueTest {
  private RetrieveQueue servlet;
  private HttpServletRequest request;
  private HttpServletResponse response;

  @Before
  public void setUp() {
    servlet = new RetrieveQueue();
    request = mock(HttpServletRequest.class);
    response = mock(HttpServletResponse.class);
  }

  @Test
  public void testEmptyRoom() throws Exception {
    when(request.getParameter("room_id")).thenReturn("testEmptyQueue");
    StringWriter stringWriter = new StringWriter();
    PrintWriter writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);

    servlet.doGet(request, response);
    Assert.assertTrue(stringWriter.toString().contains(""));
  }

  @Test
  public void testFakeRoom() throws Exception {
    when(request.getParameter("room_id")).thenReturn("FAKE ROOM");
    StringWriter stringWriter = new StringWriter();
    PrintWriter writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
    servlet.doGet(request, response);
    Assert.assertTrue(stringWriter.toString().contains("error: room does not exist"));
  }

  @Test
  public void testGetOneVideo() throws Exception {
    when(request.getParameter("room_id")).thenReturn("testOneVideo");
    StringWriter stringWriter = new StringWriter();
    PrintWriter writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
    servlet.doGet(request, response);
    Assert.assertTrue(stringWriter.toString().contains("\"requestTime\":1596649245195"));
  }

  @Test
  public void testGetMultipleVideos() throws Exception {
      when(request.getParameter("room_id")).thenReturn("testMultipleVideos");
    StringWriter stringWriter = new StringWriter();
    PrintWriter writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
    servlet.doGet(request, response);
    //use three asserts because the stringWriter doesn't print items uniformly
    Assert.assertTrue(stringWriter.toString().contains("\"requestTime\":1596650659951"));
    Assert.assertTrue(stringWriter.toString().contains("\"requestTime\":1596650642805"));
    Assert.assertTrue(stringWriter.toString().contains("\"requestTime\":1596650654875"));
  }
}
