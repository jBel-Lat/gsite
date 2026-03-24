const TEAM_ROLE_MAP = {
  multimedia_head: 'multimedia',
  multimedia_member: 'multimedia',
  developer_head: 'developer',
  developer_member: 'developer',
};

const getTeamFromRole = (role) => TEAM_ROLE_MAP[role] || null;

const isHeadRole = (role) => role === 'multimedia_head' || role === 'developer_head';

module.exports = {
  getTeamFromRole,
  isHeadRole,
};

