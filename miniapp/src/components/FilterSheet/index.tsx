import { useEffect, useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import AppIcon from '../AppIcon'
import './index.scss'

const SOURCE_OPTIONS = [
  { code: '', label: '全部' },
  { code: '510100', label: '成都市' },
  { code: '510300', label: '自贡市' },
  { code: '510400', label: '攀枝花市' },
  { code: '510500', label: '泸州市' },
  { code: '510600', label: '德阳市' },
  { code: '510700', label: '绵阳市' },
  { code: '510800', label: '广元市' },
  { code: '510900', label: '遂宁市' },
  { code: '511000', label: '内江市' },
  { code: '511100', label: '乐山市' },
  { code: '511300', label: '南充市' },
  { code: '511400', label: '眉山市' },
  { code: '511500', label: '宜宾市' },
  { code: '511600', label: '广安市' },
  { code: '511700', label: '达州市' },
  { code: '511800', label: '雅安市' },
  { code: '511900', label: '巴中市' },
  { code: '512000', label: '资阳市' },
  { code: '513200', label: '阿坝州' },
  { code: '513300', label: '甘孜州' },
  { code: '513400', label: '凉山州' },
]

// 地区与来源共用同一套行政区划代码
const REGION_OPTIONS = SOURCE_OPTIONS.slice(1)

const METHOD_OPTIONS = [
  { code: '', label: '全部' },
  { code: '1', label: '公开招标' },
  { code: '2', label: '邀请招标' },
  { code: '3', label: '竞争性谈判' },
  { code: '4', label: '竞争性磋商' },
  { code: '5', label: '单一来源' },
  { code: '6', label: '询价' },
]

const NATURE_OPTIONS = [
  { code: '', label: '全部' },
  { code: '1', label: '货物' },
  { code: '2', label: '工程' },
  { code: '3', label: '服务' },
]

const TIME_OPTIONS = [
  { value: 'today', label: '今天' },
  { value: '3d', label: '近三天' },
  { value: '7d', label: '近一周' },
  { value: '30d', label: '近一月' },
]

const SHEET_META = {
  time: { title: '发布时间', grid: 'two' },
  source: { title: '交易来源', grid: 'two' },
  region: { title: '选择地区', grid: 'two' },
  nature: { title: '采购性质', grid: 'one' },
  method: { title: '采购方式', grid: 'one' },
  purchaser: { title: '采购人', grid: 'one' },
}

function SheetOption({ active, children, onClick }) {
  return (
    <View
      className={'filter-sheet__chip' + (active ? ' filter-sheet__chip--active' : '')}
      onClick={onClick}
    >
      <Text>{children}</Text>
    </View>
  )
}

export default function FilterSheet({
  visible,
  type = 'time',
  selectedValue = '',
  onApply,
  onClose,
}) {
  const [draftCode, setDraftCode] = useState(selectedValue || '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const sheetMeta = SHEET_META[type] || { title: '筛选', grid: 'two' }

  useEffect(() => {
    if (visible) {
      setDraftCode(selectedValue || '')
    }
  }, [visible, selectedValue])

  if (!visible) return null

  const handleApply = (code, label) => {
    if (onApply) onApply(type, code, label)
    if (onClose) onClose()
  }

  const handleReset = () => {
    setDraftCode('')
    setStartDate('')
    setEndDate('')
    if (onApply) onApply(type, '', '')
    if (onClose) onClose()
  }

  const renderGrid = (options, gridMode = sheetMeta.grid) => (
    <View
      className={
        'filter-sheet__grid' +
        (gridMode === 'two' ? ' filter-sheet__grid--two' : '') +
        (gridMode === 'one' ? ' filter-sheet__grid--one' : '')
      }
    >
      {options.map((option) => (
        <SheetOption
          key={option.code}
          active={draftCode === option.code}
          onClick={() => setDraftCode(option.code)}
        >
          {option.label}
        </SheetOption>
      ))}
    </View>
  )

  const renderBody = () => {
    if (type === 'time') {
      return (
        <View className="filter-sheet__section">
          <Text className="filter-sheet__section-title">快捷时间</Text>
          {renderGrid(TIME_OPTIONS.map((option) => ({
            code: option.value,
            label: option.label,
          })), 'two')}
          <Text className="filter-sheet__section-title">自定义时间段</Text>
          <View className="filter-sheet__date-stack">
            <View>
              <Text className="filter-sheet__field-label">开始时间</Text>
              <Picker mode="date" value={startDate} onChange={(event) => setStartDate(event.detail.value)}>
                <View className="filter-sheet__date-field">
                  <Text>{startDate || '开始日期'}</Text>
                </View>
              </Picker>
            </View>
            <View>
              <Text className="filter-sheet__field-label">结束时间</Text>
              <Picker mode="date" value={endDate} onChange={(event) => setEndDate(event.detail.value)}>
                <View className="filter-sheet__date-field">
                  <Text>{endDate || '结束日期'}</Text>
                </View>
              </Picker>
            </View>
          </View>
        </View>
      )
    }

    if (type === 'source') {
      return (
        <View className="filter-sheet__section">
          {renderGrid(SOURCE_OPTIONS)}
        </View>
      )
    }

    if (type === 'region') {
      return (
        <View className="filter-sheet__section">
          {renderGrid(REGION_OPTIONS)}
        </View>
      )
    }

    if (type === 'nature') {
      return (
        <View className="filter-sheet__section">
          <View className="filter-sheet__list">
            {NATURE_OPTIONS.map((option) => (
              <SheetOption
                key={option.code}
                active={draftCode === option.code}
                onClick={() => setDraftCode(option.code)}
              >
                {option.label}
              </SheetOption>
            ))}
          </View>
        </View>
      )
    }

    if (type === 'method') {
      return (
        <View className="filter-sheet__section">
          <View className="filter-sheet__list">
            {METHOD_OPTIONS.map((option) => (
              <SheetOption
                key={option.code}
                active={draftCode === option.code}
                onClick={() => setDraftCode(option.code)}
              >
                {option.label}
              </SheetOption>
            ))}
          </View>
        </View>
      )
    }

    if (type === 'purchaser') {
      return (
        <View className="filter-sheet__section">
          <Input
            className="filter-sheet__input"
            type="text"
            value={draftCode}
            placeholder="输入采购人名称"
            onInput={(event) => setDraftCode(event.detail.value)}
          />
        </View>
      )
    }

    return null
  }

  // 确定最终 code 和 label
  const getConfirmValue = () => {
    if (type === 'time') {
      if (startDate && endDate) {
        return { code: `${startDate}|${endDate}`, label: `${startDate} 至 ${endDate}` }
      }
      const found = TIME_OPTIONS.find((o) => o.value === draftCode)
      return { code: draftCode, label: found?.label || draftCode }
    }
    if (type === 'source') {
      const found = SOURCE_OPTIONS.find((o) => o.code === draftCode)
      return { code: draftCode, label: found?.label || draftCode }
    }
    if (type === 'region') {
      const found = REGION_OPTIONS.find((o) => o.code === draftCode)
      return { code: draftCode, label: found?.label || draftCode }
    }
    if (type === 'method') {
      const found = METHOD_OPTIONS.find((o) => o.code === draftCode)
      return { code: draftCode, label: found?.label || draftCode }
    }
    if (type === 'nature') {
      const found = NATURE_OPTIONS.find((o) => o.code === draftCode)
      return { code: draftCode, label: found?.label || draftCode }
    }
    // purchaser: code 即输入文本本身
    return { code: draftCode, label: draftCode }
  }

  return (
    <View className="filter-sheet-mask" onClick={onClose}>
      <View className="filter-sheet" catchMove onClick={(e) => e.stopPropagation()}>
        <View className="filter-sheet__head">
          <Text className="filter-sheet__title">{sheetMeta.title}</Text>
          <Text className="filter-sheet__close" onClick={onClose}>关闭</Text>
        </View>
        <View className="filter-sheet__body">{renderBody()}</View>
        <View className="filter-sheet__footer">
          <View className="filter-sheet__footer-button filter-sheet__footer-button--secondary" onClick={handleReset}>
            <Text>重置</Text>
          </View>
          <View
            className="filter-sheet__footer-button filter-sheet__footer-button--primary"
            onClick={() => {
              const { code, label } = getConfirmValue()
              handleApply(code, label)
            }}
          >
            <Text>确定</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
