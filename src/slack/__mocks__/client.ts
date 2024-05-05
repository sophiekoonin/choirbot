let postMessageOk = true
let reactionsGetOk = true
export const SlackClient = {
  chat: {
    postMessage: jest.fn(() => {
      return {
        ok: postMessageOk,
        ts: 'returnTimestamp'
      }
    }),
    update: jest.fn()
  },
  conversations: {
    history: jest.fn()
  },
  reactions: {
    add: jest.fn(),
    get: jest.fn(() => {
      return {
        ok: reactionsGetOk,
        message: {
          reactions: [
            {
              name: 'thumbsup',
              count: 1
            },
            {
              name: 'thumbsdown',
              count: 1
            }
          ]
        }
      }
    })
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
  },
  setPostMessageOk(ok: boolean) {
    postMessageOk = ok
  },
  setReactionsGetOk(ok: boolean) {
    reactionsGetOk = ok
  }
}
