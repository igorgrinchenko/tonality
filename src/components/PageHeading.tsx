import { ReactNode } from "react";

interface PageHeadingProps {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}

export default function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
    return (
        <div className="page-heading">
            <div className="page-heading-copy">
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <h1 className="page-title">{title}</h1>
                {description && <p className="page-description">{description}</p>}
            </div>
            {action && <div className="page-heading-action">{action}</div>}
        </div>
    );
}
