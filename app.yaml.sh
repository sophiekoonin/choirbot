#!/bin/bash
echo """
runtime: nodejs16
instance_class: F1
automatic_scaling:
  max_instances: 1
env_variables:
  GCLOUD_PROJECT: \"$GCLOUD_PROJECT\"
  SLACK_CLIENT_ID: \"$SLACK_CLIENT_ID\"
  SLACK_CLIENT_SECRET: \"$SLACK_CLIENT_SECRET\"
  SLACK_SIGNING_SECRET: \"$SLACK_SIGNING_SECRET\"
  SLACK_APP_ID: \"$SLACK_APP_ID\"
"""
