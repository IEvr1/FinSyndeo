type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
};

export function AdminFunctionPage({ eyebrow, title, lead, children }: Props) {
  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {children}
    </>
  );
}
