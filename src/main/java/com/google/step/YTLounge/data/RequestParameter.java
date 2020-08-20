package com.google.step.YTLounge.data;

import javax.servlet.http.HttpServletRequest;

public class RequestParameter {
  public RequestParameter() {}

  /**
   * Locates a request parameter and returns the value associated with the desired parameter
   *
   * @param request the request made to the servlet
   * @param name the name of the desired request parameter
   * @param defaultValue the base value to return if the desired parameter isn't in the request
   * @return the value of the desired request parameter if found in the request, otherwise the given
   *     defaultValue
   */
  public static String getParameter(HttpServletRequest request, String name, String defaultValue) {
    String value = request.getParameter(name);
    if (value == null) {
      return defaultValue;
    }
    return value;
  }
}
