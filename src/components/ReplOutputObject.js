import React from 'react';
import _ from 'lodash';
import ReplOutput from '../common/ReplOutput';
import ReplCommon from '../common/ReplCommon';

export default class ReplOutputObject extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapse: true
    }

    this.onToggleCollapse = this.onToggleCollapse.bind(this);
    this.getType = this.getType.bind(this);
    this.getAllProps = this.getAllProps.bind(this);
  }

  onToggleCollapse() {
    this.setState({
      collapse: !this.state.collapse
    });
  }

  getType(obj) {
    let type = obj ? ReplCommon.type(obj) : 'Object';
    return ` ${type !== 'Undefined' ? type : 'Object'} {}`;
  }

  getAllProps() {
    let names = Object.getOwnPropertyNames(this.props.object);
    let symbols = Object.getOwnPropertySymbols(this.props.object);
    return _.sortBy(names.concat(symbols), (value) => {
      return value.toString();
    });
  }

  render() {
    let label = ReplCommon.highlight(this.props.label || this.getType(this.props.object));
    return (
      <span className='repl-entry-message-output-object-folds'>
        {
          this.state.collapse
          ? <span className='repl-entry-message-output-object'>
              <i className='fa fa-play' onClick={this.onToggleCollapse}></i>
              <span className='object-desc' dangerouslySetInnerHTML={{__html:label}}></span>
            </span>
          : <span className='repl-entry-message-output-object'>
              <i className='fa fa-play fa-rotate-90' onClick={this.onToggleCollapse}></i>
              <span className='object-desc' dangerouslySetInnerHTML={{__html:label}}></span>
              <span className='object-rec'>
              {
                _.map(this.getAllProps(), (key) => {
                  let value = ReplOutput.readProperty(this.props.object, key);
                  let keyClass = this.props.object.propertyIsEnumerable(key) ? 'object-key' : 'object-key dull';
                  return (
                    <div className='object-entry' key={key.toString()}>
                      {
                        <span className={keyClass}>
                          {key.toString()}
                          <span className='object-colon'>: </span>
                        </span>
                      }
                      {
                        value && value._isReactElement
                          ? {value}
                          : ReplOutput.transformObject(value)
                      }
                    </div>
                  )
                })
              }
              {
                this.props.object.__proto__
                ?  <div className='object-entry' key='prototype'>
                      __proto__
                      <span className='object-colon'>: </span>
                      <ReplOutputObject object={Object.getPrototypeOf(this.props.object)} label={this.getType(this.props.object.__proto__)} primitive={false}/>
                  </div>
                : null
              }
              {
                this.props.primitive
                 ? <div className='object-entry' key='[[PrimitiveValue]]'>
                     {
                       <span className='object-key dull'>
                         [[PrimitiveValue]]
                         <span className='object-colon'>: </span>
                       </span>
                     }
                     { ReplOutput.transformObject(this.props.object.toString()) }
                   </div>
                 : null
              }
              </span>
            </span>
        }
      </span>
    );
  }
}
