package com.google.step.YTLounge.data;

import javax.servlet.http.HttpServletRequest;

public class RequestParameter {
  public RequestParameter() {}

  public static String getParameter(HttpServletRequest request, String name, String defaultValue) {
    String value = request.getParameter(name);
    if (value == null) {
      return defaultValue;
    }
    return value;
  }
}
