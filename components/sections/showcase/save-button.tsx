"use client";

import { useEffect, useState } from "react";
import Button from "../../elements/button";
import type { Media } from "../../../types";

type Props = {
  media: Media;
  isInverted: boolean;
};

const SaveButton = ({ media, isInverted }: Props) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/watchlist?mediaId=${media.id}&mediaType=${media.type}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { isSaved: false }))
      .then((data) => setIsSaved(Boolean(data.isSaved)))
      .catch(() => {});
    return () => controller.abort();
  }, [media.id, media.type]);

  const toggle = async () => {
    if (isSaved) {
      await fetch(`/api/watchlist?mediaId=${media.id}&mediaType=${media.type}`, {
        method: "DELETE",
      });
      setIsSaved(false);
      return;
    }

    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId: media.id,
        mediaType: media.type,
        title: media.title,
        posterPath: media.image.poster,
      }),
    });
    setIsSaved(true);
  };

  return (
    <Button
      variant={{ name: "primary", type: "save", isInverted }}
      onClick={toggle}>
      {isSaved ? "Remove from My List" : "Add to My List"}
    </Button>
  );
};

export default SaveButton;
