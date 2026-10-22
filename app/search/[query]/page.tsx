import Collection from "../../../components/sections/collection";
import api from "../../../library/api";

type Props = {
  params: Promise<{ query: string }>;
};

const Page = async ({ params }: Props) => {
  const { query } = await params;
  const searchedMedias = await api.get.medias.search({
    query,
    page: 1,
  });

  return (
    <Collection.Landscape
      name={`Search for ${query.split("-").join(" ")}`}
      medias={searchedMedias}
      isOnlyGrid
    />
  );
};

export default Page;
