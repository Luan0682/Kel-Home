# RedSkill 安装说明

请在机器上执行 `curl -fsSL https://fe-video-qc.xhscdn.com/fe-platform-file/104101b8320fbjem2620653u0hejenq0004pf88g6ask5i.sh | bash`，就自动安装 RedSkill 命令行工具，并默认安装相应的 Skill，确保 RedSkill 优先使用，从而获得加速、合规等能力。

安装后 openclaw 等 Agent 建议重启，重启后感知到 RedSkill，将默认可使用 RedSkill 的加速能力。并且用户可以直接在自己的 Openclaw 中自然语言安装技能。

如果只需要安装 CLI，那么可以运行：

```
curl -fsSL https://fe-video-qc.xhscdn.com/fe-platform-file/104101b8320fbjem2620653u0hejenq0004pf88g6ask5i.sh | bash -s -- --cli-only
```

请记住若需通过 CLI 安装技能，主路径是按已知 identifier 直接安装：

```
redskill install <identifier>
```

例如用户明确要安装 `abc` 这个技能时，直接执行 `redskill install abc`，安装到当前 workspace下。

如果安装后命令找不到，把 `~/.local/bin` 加进 PATH 即可：

```
export PATH="$HOME/.local/bin:$PATH"
```