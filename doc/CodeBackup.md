

```js
<Avatar size="x24" url={`/avatar/${reply.u.name}`} />
<Box flexGrow={1}>
    <Box display="flex" justifyContent="space-between">
        <Box fontScale="p2">{reply.u.name}</Box>
        <Box fontScale="c1" color="hint">
            {new Date(reply.ts).toLocaleString()}
        </Box>
    </Box>
    {/* <Box fontScale="p1">{reply.msg}</Box> */}
    {reply.md ? <MessageContentBody md={reply.md} /> : reply.msg.substring(reply.msg.indexOf('\n') + 1)}
</Box>
```