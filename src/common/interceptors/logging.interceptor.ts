import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const info = ctx.getInfo();

    const start = Date.now();

    const section = context.getClass().name;

    const operation = context.getHandler().name;

    const gqlName = info.fieldName;

    const user = req.user;
    const userIdentifier = user?.codigo
      ? user.codigo
      : user?.id
        ? `User:${user.id}`
        : 'Anon';
    const userLabel = `[${userIdentifier}]`;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const durationStr = `${duration}ms`.padEnd(7, ' ');

        this.logger.log(
          `${userLabel.padEnd(10)} ${section} > ${gqlName} (${durationStr})`,
        );
      }),
    );
  }
}
