import shuffleMedias from "../helpers/shuffle-medias";
import type { Media } from "../types";
import api from "./api";
import cuid from "cuid";

type Page =
  | "home"
  | "series"
  | "movies"
  | "originals"
  | "marvel"
  | "pixar"
  | "national-geographic"
  | "starwars"
  | "star"
  | "disney";
type Data = { id: string; name: string; medias: Media[] };
type Row = { name: string; fetch: () => Promise<Media[]> };

// TMDB company/network ids (verified against the TMDB API)
const STUDIO = {
  waltDisneyPictures: "2",
  waltDisneyAnimation: "6125",
  disneyAnimationCombo: "2|6125",
  marvelStudios: "420",
  lucasfilm: "1",
  pixar: "3",
  twentiethCenturyStudios: "127928",
  searchlightPictures: "127929",
  starStudiosCombo: "127928|127929",
  nationalGeographicFilms: "7521|189457",
};

const NETWORK = {
  disneyPlus: "2739",
  nationalGeographic: "43",
  abc: "2",
};

// Bound "new/upcoming" queries to today so we never show far-future placeholders
const today = () => new Date().toISOString().slice(0, 10);

// Runs every row's fetch concurrently instead of waiting on each one in turn
const resolve = async (rows: Row[]): Promise<Data[]> => {
  const medias = await Promise.all(rows.map((row) => row.fetch()));
  return rows.map((row, index) => ({
    id: cuid(),
    name: row.name,
    medias: medias[index],
  }));
};

const trendingCombined = async (type: "movies" | "series") =>
  shuffleMedias(
    (
      await Promise.all([
        api.get.medias.trending({ type, time: "day" }),
        api.get.medias.trending({ type, time: "week" }),
      ])
    ).flat()
  );

const data = async (page: Page): Promise<Data[]> => {
  switch (page) {
    case "home": {
      return resolve([
        {
          name: "Disney+ Originals",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              networks: NETWORK.disneyPlus,
              sortBy: "popularity.desc",
            }),
        },
        {
          name: "Popular Movies",
          fetch: () =>
            api.get.medias.group({ name: "popular", type: "movies", page: 1 }),
        },
        {
          name: "Popular Series",
          fetch: () =>
            api.get.medias.group({ name: "popular", type: "series", page: 1 }),
        },
        {
          name: "New to Disney+",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.disneyAnimationCombo,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Marvel Cinematic Universe",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.marvelStudios,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Best of Pixar",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.pixar,
              sortBy: "popularity.desc",
            }),
        },
      ]);
    }
    case "series": {
      return resolve([
        {
          name: "Disney+ Originals",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              networks: NETWORK.disneyPlus,
              sortBy: "popularity.desc",
            }),
        },
        { name: "Trending Series", fetch: () => trendingCombined("series") },
        {
          name: "Popular Series",
          fetch: () =>
            api.get.medias.group({ name: "popular", type: "series", page: 1 }),
        },
        {
          name: "Top Rated Series",
          fetch: () =>
            api.get.medias.group({
              name: "top-rated",
              type: "series",
              page: 1,
            }),
        },
        {
          name: "Live Now",
          fetch: () =>
            api.get.medias.group({
              name: "on-the-air",
              type: "series",
              page: 1,
            }),
        },
        {
          name: "New Episodes",
          fetch: () =>
            api.get.medias.group({
              name: "airing-today",
              type: "series",
              page: 1,
            }),
        },
      ]);
    }
    case "movies": {
      return resolve([
        {
          name: "From The Walt Disney Studios",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: `${STUDIO.disneyAnimationCombo}|${STUDIO.marvelStudios}|${STUDIO.lucasfilm}|${STUDIO.pixar}`,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        { name: "Trending Movies", fetch: () => trendingCombined("movies") },
        {
          name: "Now Playing",
          fetch: () =>
            api.get.medias.group({
              name: "now-playing",
              type: "movies",
              page: 1,
            }),
        },
        {
          name: "Just Released",
          fetch: () =>
            api.get.medias.group({ name: "upcoming", type: "movies", page: 1 }),
        },
        {
          name: "Top Rated Movies",
          fetch: () =>
            api.get.medias.group({
              name: "top-rated",
              type: "movies",
              page: 1,
            }),
        },
        {
          name: "Popular",
          fetch: () =>
            api.get.medias.group({ name: "popular", type: "movies", page: 1 }),
        },
      ]);
    }
    case "originals": {
      const [marvelMedias, starwarsMedias, disneyMedias, pixarMedias, natGeoMedias] =
        await Promise.all([
          api.get.medias.discover({
            type: "movies",
            companies: STUDIO.marvelStudios,
            sortBy: "popularity.desc",
          }),
          api.get.medias.discover({
            type: "movies",
            companies: STUDIO.lucasfilm,
            sortBy: "popularity.desc",
          }),
          api.get.medias.discover({
            type: "movies",
            companies: STUDIO.disneyAnimationCombo,
            sortBy: "popularity.desc",
          }),
          api.get.medias.discover({
            type: "movies",
            companies: STUDIO.pixar,
            sortBy: "popularity.desc",
          }),
          api.get.medias.discover({
            type: "series",
            networks: NETWORK.nationalGeographic,
            sortBy: "popularity.desc",
          }),
        ]);
      return [
        {
          id: cuid(),
          name: "Featured",
          medias: shuffleMedias([
            ...marvelMedias,
            ...starwarsMedias,
            ...disneyMedias,
            ...pixarMedias,
            ...natGeoMedias,
          ]),
        },
        { id: cuid(), name: "Marvel", medias: marvelMedias },
        { id: cuid(), name: "Star Wars", medias: starwarsMedias },
        { id: cuid(), name: "Disney", medias: disneyMedias },
        { id: cuid(), name: "Pixar", medias: pixarMedias },
        { id: cuid(), name: "National Geographic", medias: natGeoMedias },
      ];
    }
    case "marvel": {
      return resolve([
        {
          name: "New & Upcoming",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.marvelStudios,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Most Popular",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.marvelStudios,
              sortBy: "popularity.desc",
            }),
        },
        {
          name: "Top Rated",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.marvelStudios,
              sortBy: "vote_average.desc",
              minVotes: 300,
            }),
        },
        {
          name: "Marvel Series",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              companies: STUDIO.marvelStudios,
              sortBy: "popularity.desc",
            }),
        },
      ]);
    }
    case "pixar": {
      return resolve([
        {
          name: "Featured",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.pixar,
              sortBy: "popularity.desc",
            }),
        },
        {
          name: "New & Upcoming",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.pixar,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Toy Story",
          fetch: () => api.get.medias.search({ query: "toy story", page: 1 }),
        },
        {
          name: "Cars",
          fetch: () => api.get.medias.search({ query: "Cars", page: 1 }),
        },
        {
          name: "The Incredibles",
          fetch: () =>
            api.get.medias.search({ query: "the incredibles", page: 1 }),
        },
      ]);
    }
    case "starwars": {
      return resolve([
        {
          name: "New & Upcoming",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.lucasfilm,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Most Popular",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.lucasfilm,
              sortBy: "popularity.desc",
            }),
        },
        {
          name: "Star Wars Series",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              companies: STUDIO.lucasfilm,
              sortBy: "popularity.desc",
            }),
        },
      ]);
    }
    case "disney": {
      return resolve([
        {
          name: "Featured",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.disneyAnimationCombo,
              sortBy: "popularity.desc",
            }),
        },
        {
          name: "New Disney Movies",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.disneyAnimationCombo,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Disney Classics",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.disneyAnimationCombo,
              sortBy: "vote_average.desc",
              minVotes: 500,
            }),
        },
        {
          name: "Disney+ Original Series",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              networks: NETWORK.disneyPlus,
              sortBy: "popularity.desc",
            }),
        },
      ]);
    }
    case "national-geographic": {
      return resolve([
        {
          name: "National Geographic Series",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              networks: NETWORK.nationalGeographic,
              sortBy: "popularity.desc",
              minVotes: 5,
            }),
        },
        {
          name: "Documentaries",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.nationalGeographicFilms,
              sortBy: "popularity.desc",
              minVotes: 5,
            }),
        },
        {
          name: "New Releases",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.nationalGeographicFilms,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
              minVotes: 1,
            }),
        },
        {
          name: "Most Acclaimed",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.nationalGeographicFilms,
              sortBy: "vote_average.desc",
              minVotes: 50,
            }),
        },
      ]);
    }
    case "star": {
      return resolve([
        {
          name: "Only on Star",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.starStudiosCombo,
              sortBy: "popularity.desc",
            }),
        },
        {
          name: "New Releases",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.starStudiosCombo,
              sortBy: "primary_release_date.desc",
              releaseDateLte: today(),
            }),
        },
        {
          name: "Acclaimed Films",
          fetch: () =>
            api.get.medias.discover({
              type: "movies",
              companies: STUDIO.starStudiosCombo,
              sortBy: "vote_average.desc",
              minVotes: 300,
            }),
        },
        {
          name: "ABC & Star Series",
          fetch: () =>
            api.get.medias.discover({
              type: "series",
              networks: NETWORK.abc,
              sortBy: "popularity.desc",
            }),
        },
      ]);
    }
    default:
      return [];
  }
};

export default data;
