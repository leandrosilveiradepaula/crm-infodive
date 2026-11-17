import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

export default function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
    return <a href={href} {...props} onClick={(event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()}>{children}</a>;
}
