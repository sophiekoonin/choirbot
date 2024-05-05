export const SlackClient = {
  chat: {
    postMessage: jest.fn(),
    update: jest.fn()
  },
  conversations: {
    history: jest.fn()
  },
  reactions: {
    add: jest.fn(),
    get: jest.fn()
  },
  users: {
    list: jest.fn()
  },
  channels: {
    join: jest.fn()
  },
  views: {
    open: jest.fn(),
    publish: jest.fn(),
    update: jest.fn()
  },
  oauth: {
    v2: {
      access: jest.fn()
    }
  }
}
