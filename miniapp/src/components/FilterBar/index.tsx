import { View, Text } from '@tarojs/components'
import { AtSearchBar, AtSegmentedControl } from 'taro-ui'
import AppIcon from '../AppIcon'
import './index.scss'

const FILTER_MODES = {
  'engineering-engineering': {
    placeholder: '搜索标题、内容和描述关键词',
    segment: true,
    buttons: [
      { key: 'time', label: '发布时间', icon: 'calendar' },
      { key: 'source', label: '交易来源', icon: 'mappin' },
    ],
    layout: 'row',
  },
  'engineering-procurement': {
    placeholder: '搜索标题、内容和描述关键词',
    buttons: [
      { key: 'time', label: '发布时间', icon: 'calendar' },
      { key: 'source', label: '交易来源', icon: 'mappin' },
    ],
    layout: 'row',
  },
  'procurement-intention': {
    placeholder: '搜索标题 / 公告编码 / 采购人',
    buttons: [
      { key: 'time', label: '发布时间', icon: 'calendar' },
      { key: 'region', label: '区划', icon: 'mappin' },
    ],
    layout: 'row',
  },
  'procurement-announcement': {
    placeholder: '搜索标题 / 项目编号 / 采购人 / 代理机构',
    buttons: [
      { key: 'nature', label: '采购性质' },
      { key: 'method', label: '采购方式' },
      { key: 'time', label: '发布时间', icon: 'calendar' },
      { key: 'region', label: '区划', icon: 'mappin' },
    ],
    layout: 'grid',
  },
  information: {
    placeholder: '搜索标题、内容和描述关键词',
    buttons: [],
    layout: 'row',
  },
}

function FilterButton({ icon, label, value, onClick }) {
  return (
    <View className="filter-bar__button" onClick={onClick}>
      {icon ? <AppIcon name={icon} size={28} color="#4E5969" /> : null}
      <Text className="filter-bar__button-text">{value || label}</Text>
      <AppIcon name="chevrondown" size={24} color="#86909C" />
    </View>
  )
}

export default function FilterBar({
  type,
  keyword,
  onKeywordChange,
  onFilterClick,
  filterValues = {},
  announcementType = 'announcement',
  onAnnouncementTypeChange,
}) {
  const mode = FILTER_MODES[type]

  if (!mode) return null

  const renderSearch = () => (
    <AtSearchBar
      value={keyword}
      placeholder={mode.placeholder}
      onChange={(v) => onKeywordChange && onKeywordChange(v)}
    />
  )

  const renderButtons = (buttons) => (
    <View
      className={
        'filter-bar__button-row' +
        (mode.layout === 'grid' ? ' filter-bar__button-row--grid' : '')
      }
    >
      {buttons.map((button) => (
        <FilterButton
          key={button.key}
          icon={button.icon}
          label={button.label}
          value={filterValues[button.key]}
          onClick={() => onFilterClick && onFilterClick(button.key)}
        />
      ))}
    </View>
  )

  return (
    <View className={'filter-bar' + (mode.buttons.length === 0 ? ' filter-bar--minimal' : '')}>
      {mode.segment && (
        <AtSegmentedControl
          values={['招标计划', '招标公告']}
          current={announcementType === 'plan' ? 0 : 1}
          onClick={(index) => onAnnouncementTypeChange && onAnnouncementTypeChange(index === 0 ? 'plan' : 'announcement')}
        />
      )}

      {renderSearch()}

      {mode.buttons.length > 0 && renderButtons(mode.buttons)}
    </View>
  )
}
