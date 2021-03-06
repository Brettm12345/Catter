/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getuser
// ====================================================

export interface getuser_user_meows_author {
  __typename: "User";
  id: string;
  username: string;
  name: string;
}

export interface getuser_user_meows_likedBy {
  __typename: "User";
  id: string;
  username: string;
  name: string;
}

export interface getuser_user_meows_replyingTo_author {
  __typename: "User";
  id: string;
  username: string;
  name: string;
}

export interface getuser_user_meows_replyingTo {
  __typename: "Meow";
  id: string;
  author: getuser_user_meows_replyingTo_author;
}

export interface getuser_user_meows {
  __typename: "Meow";
  id: string;
  content: string;
  author: getuser_user_meows_author;
  likedBy: getuser_user_meows_likedBy[];
  replyingTo: getuser_user_meows_replyingTo | null;
}

export interface getuser_user {
  __typename: "User";
  id: string;
  name: string;
  meows: getuser_user_meows[];
}

export interface getuser {
  user: getuser_user | null;
}

export interface getuserVariables {
  username: string;
}
