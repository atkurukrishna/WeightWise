import { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
}

export function FeatureCard({ title, description, icon }: Props) {
  return (
    <div className="feature-card">
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
