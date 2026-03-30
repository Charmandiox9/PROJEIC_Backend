import { Resolver, Query, Mutation, Args, ID, Info } from '@nestjs/graphql';
import type { GraphQLResolveInfo, FieldNode, SelectionNode } from 'graphql';
import { Project } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { ProjectEntity } from './entities/project.entity';
import { PaginatedProjects } from './dto/paginated-projects.type';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { ProjectsFilterInput } from './dto/projects-filter.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';

/** Type guard que reemplaza los import() inline, evitando el error de isolatedModules */
function isFieldNode(node: SelectionNode): node is FieldNode {
  return node.kind === 'Field';
}

/**
 * Detecta si el cliente pidió el campo 'members' dentro de items.
 * Evita hacer el JOIN innecesario cuando no se necesitan los members.
 */
function clientRequestedMembers(info: GraphQLResolveInfo): boolean {
  const topSelections = info.fieldNodes[0]?.selectionSet?.selections ?? [];

  const itemsField = topSelections
    .filter(isFieldNode)
    .find((s) => s.name.value === 'items');

  if (!itemsField) return false;

  return (itemsField.selectionSet?.selections ?? [])
    .filter(isFieldNode)
    .some((f) => f.name.value === 'members');
}

@Resolver(() => ProjectEntity)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) { }

  // ─── Queries ─────────────────────────────────────────────────────────────

  @Query(() => PaginatedProjects)
  findAll(
    @CurrentUser() user: any, // 1. Inyectamos el usuario
    @Args('filter', { nullable: true }) filter?: ProjectsFilterInput,
    @Args('includeMembers', { type: () => Boolean, nullable: true })
    includeMembers?: boolean,
  ) {
    return this.projectsService.findAll(user?.sub, filter, includeMembers);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedProjects, { name: 'myProjects' })
  findMyProjects(
    @CurrentUser() user: any,
    @Args('filter', { nullable: true }) filter?: ProjectsFilterInput,
    @Args('includeMembers', { type: () => Boolean, nullable: true })
    includeMembers?: boolean,
  ) {
    // Usamos el mismo truco seguro para extraer el ID que descubrimos antes
    const userId = user.id || user.userId || user.sub;

    if (!userId) {
      throw new Error(
        'No se pudo extraer el ID del usuario desde el token JWT',
      );
    }

    return this.projectsService.findMyProjects(userId, filter, includeMembers);
  }

  @Query(() => ProjectEntity)
  findOne(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: any, // 1. Inyectamos el usuario
  ) {
    return this.projectsService.findOne(id, user?.sub);
  }

  // ─── Mutations ───────────────────────────────────────────────────────────

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ProjectEntity, { name: 'createProject' })
  create(
    @Args('input') input: CreateProjectInput,
    @CurrentUser() user: any,
  ): Promise<Project> {
    const userId = user.id || user.userId || user.sub;
    if (!userId) throw new Error('No user identity found in token');
    return this.projectsService.create(input, userId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ProjectEntity)
  updateProject(
    @Args('input') input: UpdateProjectInput,
    @CurrentUser() user: any,
  ) {
    console.log('Datos del JWT decodificado:', user);

    const userId = user.id || user.userId || user.sub;

    if (!userId) {
      throw new Error(
        'No se pudo extraer el ID del usuario desde el token JWT',
      );
    }

    // 3. Pasamos el ID real al servicio
    return this.projectsService.update(input, userId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ProjectEntity, {
    name: 'archiveProject',
    description: 'Soft-delete a project (sets isArchived = true)',
  })
  archive(@Args('id', { type: () => ID }) id: string): Promise<Project> {
    return this.projectsService.archive(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => ProjectEntity, {
    name: 'deleteProject',
    description: 'Permanently delete a project and all its data (cascades)',
  })
  remove(@Args('id', { type: () => ID }) id: string): Promise<Project> {
    return this.projectsService.remove(id);
  }
}
