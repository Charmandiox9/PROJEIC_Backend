import { registerEnumType } from '@nestjs/graphql';
import {
  ProjectStatus,
  ProjectRole,
  ProjectMethodology,
  ProjectMode,
  ResultStatus,
  ActivityEntity,
  ActivityAction,
} from '@prisma/client';

export {
  ProjectStatus,
  ProjectRole,
  ProjectMethodology,
  ProjectMode,
  ResultStatus,
  ActivityEntity,
  ActivityAction,
};

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

registerEnumType(ProjectMode, {
  name: 'ProjectMode',
  description: 'Modo de gestión del proyecto (Clásico o Híbrido)',
});

registerEnumType(ResultStatus, {
  name: 'ResultStatus',
  description: 'Estado de un Resultado Esperado',
});
