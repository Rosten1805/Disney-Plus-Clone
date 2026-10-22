"use client";

import { useEffect, useState } from "react";
import Toggle from "./toggle";
import Select from "./select";

type Settings = {
  language: string;
  region: string;
  notifyEmail: boolean;
  notifyNewReleases: boolean;
  notifyRecommendations: boolean;
  autoplayPreviews: boolean;
  matureContentFilter: boolean;
  playbackQuality: string;
};

const DEFAULT_SETTINGS: Settings = {
  language: "en",
  region: "US",
  notifyEmail: true,
  notifyNewReleases: true,
  notifyRecommendations: false,
  autoplayPreviews: true,
  matureContentFilter: false,
  playbackQuality: "auto",
};

const STORAGE_KEY = "profile-settings";

type Props = {
  name?: string | null;
  email?: string | null;
  provider?: string | null;
};

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg bg-card-dark p-4 tablet:p-6">
    <h2 className="mb-2 font-semibold">{title}</h2>
    <div className="divide-y divide-white/5">{children}</div>
  </div>
);

const SettingsSection = ({ name, email, provider }: Props) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore unreadable/corrupt local storage
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, [settings, isLoaded]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  return (
    <section className="grid gap-4 tablet:grid-cols-2">
      <Card title="Language & region">
        <Select
          label="Language"
          value={settings.language}
          onChange={(value) => update("language", value)}
          options={[
            { value: "en", label: "English" },
            { value: "es", label: "Español" },
            { value: "fr", label: "Français" },
            { value: "pt", label: "Português" },
          ]}
        />
        <Select
          label="Region"
          value={settings.region}
          onChange={(value) => update("region", value)}
          options={[
            { value: "US", label: "United States" },
            { value: "ES", label: "Spain" },
            { value: "MX", label: "Mexico" },
            { value: "GB", label: "United Kingdom" },
          ]}
        />
      </Card>

      <Card title="Notifications">
        <Toggle
          label="Email notifications"
          description="Account and billing updates"
          checked={settings.notifyEmail}
          onChange={(value) => update("notifyEmail", value)}
        />
        <Toggle
          label="New releases"
          description="Tell me when a title I might like drops"
          checked={settings.notifyNewReleases}
          onChange={(value) => update("notifyNewReleases", value)}
        />
        <Toggle
          label="Recommendations"
          description="Personalized picks based on My List"
          checked={settings.notifyRecommendations}
          onChange={(value) => update("notifyRecommendations", value)}
        />
      </Card>

      <Card title="Content preferences">
        <Toggle
          label="Autoplay previews"
          description="Play trailers automatically while browsing"
          checked={settings.autoplayPreviews}
          onChange={(value) => update("autoplayPreviews", value)}
        />
        <Toggle
          label="Mature content filter"
          description="Hide titles rated for mature audiences"
          checked={settings.matureContentFilter}
          onChange={(value) => update("matureContentFilter", value)}
        />
        <Select
          label="Playback quality"
          value={settings.playbackQuality}
          onChange={(value) => update("playbackQuality", value)}
          options={[
            { value: "auto", label: "Auto" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Data saver" },
          ]}
        />
      </Card>

      <Card title="Account">
        <div className="py-3">
          <p className="text-sm">{name}</p>
          <p className="text-xs opacity-fade">{email}</p>
          <p className="mt-2 text-xs opacity-fade">
            Signed in with {provider === "google" ? "Google" : "email"}
          </p>
        </div>
      </Card>
    </section>
  );
};

export default SettingsSection;
