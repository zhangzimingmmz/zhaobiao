import { View, Text, Input } from '@tarojs/components'
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
      <View className="filter-bar__button-main">
        {icon ? (
          <View className="filter-bar__button-icon">
            <AppIcon name={icon} size={26} color="#0B57D0" />
          </View>
        ) : null}
        <Text className="filter-bar__button-text">{value || label}</Text>
      </View>
      <AppIcon name="chevrondown" size={22} color="#86909C" />
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
    <View className="filter-bar__search">
      <View className="filter-bar__search-icon">
        <AppIcon name="search" size={28} color="#0B57D0" />
      </View>
      <Input
        className="filter-bar__search-input"
        value={keyword}
        placeholder={mode.placeholder}
        placeholderClass="filter-bar__search-placeholder"
        confirmType="search"
        onInput={(event) => onKeywordChange && onKeywordChange(event.detail.value)}
      />
    </View>
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
        <View className="filter-bar__segment">
          {[
            { key: 'plan', label: '招标计划' },
            { key: 'announcement', label: '招标公告' },
          ].map((option) => {
            const active = announcementType === option.key
            return (
              <View
                key={option.key}
                className={'filter-bar__segment-item' + (active ? ' filter-bar__segment-item--active' : '')}
                onClick={() => onAnnouncementTypeChange && onAnnouncementTypeChange(option.key)}
              >
                <Text className="filter-bar__segment-text">{option.label}</Text>
              </View>
            )
          })}
        </View>
      )}

      {renderSearch()}

      {mode.buttons.length > 0 && renderButtons(mode.buttons)}
    </View>
  )
}
