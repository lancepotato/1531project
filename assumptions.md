```

```
Assumptions:

There will never be a scenario where use up all possible permutations of the authIds between 1-20

Once a channel is created, it cannot be empty. There is no function to leave a channel and channelsCreateV1 automatically makes a member join the created channel. Keep in mind when considering stored data

Multiple authorised users can have the same names and passwords, but not the same email address. authRegister needs to make sure that each user that registers has a unique email and unique handlename

All letters would be in English.

Users that create channels will automatically be the owner of the channel.

Assume the number of people that can be invited or that can join a channel
to be unlimited. So, there is no limit on the number of members in a channel and therefore doesn't require an error check.

When creating a channel, the number of messages in the channel will be 0.