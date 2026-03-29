import { registerEnumType } from '@nestjs/graphql';
import { ProjectStatus, ProjectRole, ProjectMethodology } from '@prisma/client';

export { ProjectStatus, ProjectRole, ProjectMethodology };

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
  description: 'Current lifecycle status of a project',
});

registerEnumType(ProjectRole, {
  name: 'ProjectRole',
  description: 'Role of a user within a project',
});

registerEnumType(ProjectMethodology, {
  name: 'ProjectMethodology',
  description: 'Development methodology used in the project',
});
