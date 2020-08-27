package com.google.step.YTLounge.servlets;

import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.SearchListResponse;
import com.google.gson.Gson;
import com.google.step.YTLounge.data.RequestParameter;
import com.google.step.YTLounge.data.YoutubeService;
import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/keywordSearch")
public class KeywordSearch extends HttpServlet {
  /**
   * Accesses YouTube and retrieves a collection of videos relating to the given query/words found
   * in the request. Returns only the snippet for each video and returns only videos, no playlists
   * or channels allowed.
   */
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Gson gson = new Gson();
    response.setContentType("application/json");
    String query = RequestParameter.getParameter(request, "query", "");
    if (query.equals("")) return;
    YouTube youtubeService = null;
    try {
      youtubeService = YoutubeService.getService();
    } catch (Exception e) {
      response.getWriter().println(gson.toJson(e));
      e.printStackTrace();
    }
    if (youtubeService == null) {
      response.getWriter().println(gson.toJson("youtube service: null"));
      return;
    }
    // Define and execute the API request
    YouTube.Search.List vidRequest = youtubeService.search().list("snippet");
    SearchListResponse vidResponse =
        vidRequest.setMaxResults(15L).setQ(query).setType("video").execute();
    response.getWriter().println(gson.toJson(vidResponse));
  }
}
