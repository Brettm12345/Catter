import React, { useCallback, useState } from 'react';
import useForm from 'react-hook-form';
import { Card, CardContent, TextField, Typography } from '@material-ui/core';
import { useMutation } from 'react-apollo-hooks';
import gql from 'graphql-tag';
import { Redirect } from 'react-router-dom';

import { setname } from './types/setname';
import { useUserState } from './user-state';

interface Schema {
  name: string;
}

// react-hook-form doesn't export it's Error type so we just make do with any
const errorMessage = (e: any) => {
  // awful i know but react doesnt render anything if it tries to render null so
  // blame react
  if (!e) return null;
  switch (e.type) {
    case 'required':
      return 'Name is required';
    case 'minLength':
      return 'Name must be at least 3 characters';
    default:
      return 'Unknown error ' + e.type;
  }
};

const SET_NAME = gql`
  mutation setname($name: String!) {
    setName(name: $name) {
      id
      username
      name
    }
  }
`;

export const SettingsName = () => {
  // TODO: default value set to current name
  const { register, handleSubmit, errors } = useForm<Schema>();
  const [setName] = useMutation<setname>(SET_NAME);
  const [redirect, setRedirect] = useState(false);
  const username = useUserState('username');
  const onSubmit = useCallback(
    ({ name }: Schema) =>
      setName({ variables: { name } }).then(() => setRedirect(true)),
    [setName]
  );

  if (redirect) {
    return <Redirect to={`/${username}`} />;
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <Typography color="error" gutterBottom>
            {errorMessage(errors.name)}
          </Typography>
          <TextField
            variant="outlined"
            name="name"
            fullWidth
            required
            label="Name"
            error={Boolean(errors.name)}
            inputRef={register({ required: true, minLength: 3 })}
          />
        </CardContent>
      </form>
    </Card>
  );
};
