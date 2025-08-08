import { FeatureCard } from "../../components/FeatureCard";
import { getDictionary } from "../../lib/getDictionary";

export default async function Page({
  params
}: {
  params: { locale: string };
}) {
  const dict = await getDictionary(params.locale);
  const features = [
    {
      key: "security",
      icon: <span className="icon" aria-hidden>🛡️</span>,
      title: dict.features.security.title,
      desc: dict.features.security.desc
    },
    {
      key: "personalization",
      icon: <span className="icon" aria-hidden>⚙️</span>,
      title: dict.features.personalization.title,
      desc: dict.features.personalization.desc
    },
    {
      key: "usability",
      icon: <span className="icon" aria-hidden>✨</span>,
      title: dict.features.usability.title,
      desc: dict.features.usability.desc
    },
    {
      key: "internationalization",
      icon: <span className="icon" aria-hidden>🌍</span>,
      title: dict.features.internationalization.title,
      desc: dict.features.internationalization.desc
    },
    {
      key: "multicurrency",
      icon: <span className="icon" aria-hidden>💱</span>,
      title: dict.features.multicurrency.title,
      desc: dict.features.multicurrency.desc
    }
  ];

  return (
    <main>
      <h1>{dict.title}</h1>
      <p>{dict.tagline}</p>
      <div className="features">
        {features.map(feature => (
          <FeatureCard
            key={feature.key}
            title={feature.title}
            description={feature.desc}
            icon={feature.icon}
          />
        ))}
      </div>
    </main>
  );
}
