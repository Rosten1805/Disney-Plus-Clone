import Fade from "../../../components/elements/fade";
import Billboard from "../../../components/sections/billboard";
import Collection from "../../../components/sections/collection";
import Showcase from "../../../components/sections/showcase";
import Content from "../../../components/layouts/content";
import api from "../../../library/api";

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const [spotlightMedia, similarMedias, popularMovies] = await Promise.all([
    api.get.media.details({ type: "movies", id }),
    api.get.medias.similar({ type: "movies", id, page: 1 }),
    api.get.medias.group({ name: "popular", type: "movies", page: 1 }),
  ]);

  return (
    <>
      {/* @ts-ignore */}
      <Billboard media={spotlightMedia} />
      <Content variant="primary">
        {/* @ts-ignore */}
        <Showcase media={spotlightMedia} isMediaSelected={true} />
        <Content isSpacerOnly>
          <Fade />
          <Collection.Portrait name="More like this" medias={similarMedias} />
          <Collection.Landscape
            name="Popular Movies"
            medias={popularMovies}
            isOnlyGrid
          />
        </Content>
      </Content>
    </>
  );
};

export default Page;
