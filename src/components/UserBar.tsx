'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Icon } from '@iconify-icon/react';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #ccc;
`;

const Avatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(3, 218, 198, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #03DAC6;
  font-size: 0.75rem;
  font-weight: 600;
`;

const AuthButton = styled.button`
  background: none;
  border: 1px solid #444;
  border-radius: 6px;
  color: #03DAC6;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s;
  font-family: inherit;

  &:hover {
    border-color: #03DAC6;
    background: rgba(3, 218, 198, 0.1);
  }
`;

const OrgBadge = styled.span`
  background: rgba(3, 218, 198, 0.12);
  color: #03DAC6;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-family: monospace;
`;

export default function UserBar() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return null;
  }

  if (!session?.user) {
    return (
      <Bar>
        <AuthButton onClick={() => signIn('orcest-sso')}>
          <Icon icon="mdi:login" />
          ورود SSO
        </AuthButton>
      </Bar>
    );
  }

  const initials = session.user.name
    ? session.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  return (
    <Bar>
      <UserInfo>
        <Avatar>{initials}</Avatar>
        <span>{session.user.name || session.user.email}</span>
        <OrgBadge>subcorist</OrgBadge>
      </UserInfo>
      <AuthButton onClick={() => signOut({ callbackUrl: '/auth/login' })}>
        <Icon icon="mdi:logout" />
        خروج
      </AuthButton>
    </Bar>
  );
}
