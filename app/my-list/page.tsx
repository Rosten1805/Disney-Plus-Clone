import type { Metadata } from "next";
import Content from "../../components/layouts/content";
import Cover from "../../components/sections/cover";
import Collection from "../../components/sections/collection";
import useAuth from "../../hooks/use-auth";
import { listWatchlist } from "../../library/watchlist";
import type { Media } from "../../types";

export const metadata: Metadata = {
  title: "My List",
};

const Page = async () => {
  const { session } = await useAuth();
  const items = session?.user?.email
    ? await listWatchlist(session.user.email)
    : [];

  const medias: Media[] = items.map((item) => ({
    id: item.mediaId,
    title: item.title,
    type: item.mediaType,
    image: { poster: item.posterPath ?? undefined },
  }));

  return (
    <>
      <Cover company="disney-plus" />
      <Content variant="secondary">
        <Collection.Portrait name="My List" medias={medias} showTitle />
      </Content>
    </>
  );
};

export default Page;
