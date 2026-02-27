import { createElement } from "@wordpress/element";

export default function ProTag({ children = "Pro", variant = "primary" }) {
  const className =
    variant === "secondary"
      ? "krefrm-pro-badge krefrm-pro-badge--secondary"
      : "krefrm-pro-badge";
  return <span className={className}>{children}</span>;
}
