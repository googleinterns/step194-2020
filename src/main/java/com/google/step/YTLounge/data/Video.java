package com.google.step.YTLounge.data;

/** A YouTube video's data and relevant information */

public class Video {
    private final String title;
    private final String thumbnailLink;
    private final String videoLink;
    private final long duration;

    public Video (String title, String thumbnailLink, String videoLink,
        long duration) {
        this.title = title;
        this.thumbnailLink = thumbnailLink;
        this.videoLink = videoLink;
        this.duration = duration;
    }
}
