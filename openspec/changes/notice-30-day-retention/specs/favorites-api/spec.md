# favorites-api Specification

## MODIFIED Requirements

### Requirement: 收藏列表只返回仍可解析的目标

系统 SHALL 为当前登录用户提供收藏列表接口，并只返回仍能解析到目标记录的收藏项。

对于 `target_type='bid'` 的收藏，当关联 notices 因 retention 被删除时，系统 SHALL 将该收藏关系一并清理，不再在收藏列表中保留悬挂记录。

#### Scenario: 过期公告的收藏被一并删除

- **WHEN** 某条 bid notices 因超过 30 天保留窗口被 retention 删除
- **THEN** 指向该 notices 的收藏关系也被删除，收藏列表不再返回该项

#### Scenario: 保留窗口内收藏继续正常返回

- **WHEN** 某条 bid notices 仍在 retention 保留窗口内
- **THEN** 该收藏项继续正常出现在收藏列表中
