import Content from "../../../components/layouts/content";
import Cover from "../../../components/sections/cover";
import Collection from "../../../components/sections/collection";
import data from "../../../library/data";

type Props = {
  params: Promise<{ company: string }>;
};

const Page = async ({ params }: Props) => {
  const { company } = await params;
  const collections = await data(company as any);

  return (
    <>
      <Cover company={company} />
      <Content variant="secondary">
        {collections.map(({ id, name, medias }) => (
          <Collection.Portrait key={id} name={name} medias={medias} />
        ))}
      </Content>
    </>
  );
};

export default Page;
