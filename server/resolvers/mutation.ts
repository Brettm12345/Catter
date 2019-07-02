import { prismaObjectType } from 'nexus-prisma';
import { stringArg, idArg } from 'nexus';
import { hash, verify } from 'argon2';
import { sign } from 'jsonwebtoken';
import { validate } from 'the-big-username-blacklist';
import * as zxcvbn from 'zxcvbn';
import * as yup from 'yup';
import * as R from 'ramda';
import {
  tryCatch,
  leftTask,
  rightTask,
  TaskEither
} from 'fp-ts/lib/TaskEither';
import { left, right } from 'fp-ts/lib/Either';
import { Task } from 'fp-ts/lib/Task';

import { Context, APP_SECRET, getUserId } from '../utils';
import { User } from '../generated/prisma-client';

const signupSchema = yup.object().shape({
  username: yup
    .string()
    .required()
    .lowercase()
    .trim()
    .min(3)
    .max(20)
    .matches(/^[a-zA-Z0-9]+$/, { message: '${path} must be alphanumeric' })
    .test({
      name: 'blacklisted',
      test: validate,
      message: '${path} is in blacklist'
    }),
  password: yup.string().required()
});

interface Schema {
  username: string;
  password: string;
}

// constant :: a -> b -> a
const constant = <T>(a: T) => (_: any) => a;

const fromNullablePromise = <Err, Value>(
  f: () => Promise<Value | null>,
  onNull: Err
): TaskEither<Err, Value> =>
  new TaskEither(
    new Task(() =>
      f().then(valueOrNull =>
        valueOrNull === null ? left(onNull) : right(valueOrNull)
      )
    )
  );
const getToken = (user: User) => ({
  token: sign({ userId: user.id }, APP_SECRET),
  user
});

export const Mutation = prismaObjectType({
  name: 'Mutation',
  definition(t) {
    t.field('signup', {
      type: 'AuthPayload',
      args: {
        username: stringArg(),
        password: stringArg()
      },
      resolve: async (_, args, ctx: Context) => {
        const validateSchema = tryCatch(
          () => signupSchema.validate(args),
          (a: Error) => a.message
        );

        const validatePassword = ({ username, password }) => {
          const {
            score,
            feedback: { suggestions, warning }
          } = zxcvbn(password, [username]);
          const suggestions_ = R.ifElse(
            R.isEmpty,
            constant(''),
            R.pipe(
              R.join(' '),
              R.concat('Some suggestions are: ')
            )
          )(suggestions);

          const warning_ = R.ifElse(
            R.isEmpty,
            constant(''),
            R.concat(R.__, '.')
          )(warning);
          const err = R.join(' ', [
            'Password too weak.',
            warning_,
            suggestions_
          ]);
          return score < 3
            ? leftTask<string, Schema>(new Task(async () => err))
            : rightTask<string, Schema>(
                new Task(async () => ({ username, password }))
              );
        };

        const hashPassword = ({ password }: Schema) =>
          tryCatch(() => hash(password), constant('UNREACHABLE ID: 5'));

        const createUser = (username: string) => (hashedPassword: null) =>
          tryCatch(
            () => ctx.prisma.createUser({ username, password: hashedPassword }),
            (a: Error) => a.message
          );

        return validateSchema
          .chain(validatePassword)
          .chain(({ username, password }) =>
            hashPassword({ username, password }).chain(createUser(username))
          )
          .map(getToken)
          .fold(
            err => {
              throw new Error(err);
            },
            a => a
          )
          .run();
      }
    });

    t.field('login', {
      type: 'AuthPayload',
      args: {
        username: stringArg(), // TODO: Support email silently
        password: stringArg()
      },
      resolve: (_, { username, password }, ctx: Context) => {
        const getUser = fromNullablePromise(
          () => ctx.prisma.user({ username: username.toLowerCase().trim() }),
          'No user found with that username'
        );

        const verifyPassword = (user: User) =>
          fromNullablePromise(
            () => verify(user.password, password).then(b => (b ? user : null)),
            'Password invalid'
          );

        return getUser
          .chain(verifyPassword)
          .map(getToken)
          .fold(
            err => {
              throw new Error(err);
            },
            a => a
          )
          .run();
      }
    });

    t.field('postMeow', {
      type: 'Meow',
      args: {
        content: stringArg()
      },
      resolve: (_, { content }, ctx: Context) => {
        const userId = getUserId(ctx);
        return ctx.prisma.createMeow({
          content,
          author: { connect: { id: userId } }
        });
      }
    });

    t.field('deleteMeow', {
      type: 'Meow',
      nullable: true,
      args: { id: idArg() },
      resolve: (_, { id }, ctx: Context) => ctx.prisma.deleteMeow({ id })
    });
  }
});