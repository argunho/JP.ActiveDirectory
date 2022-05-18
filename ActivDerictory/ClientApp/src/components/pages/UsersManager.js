import React, { Component } from 'react'
import Form from '../blocks/Form';
import Info from '../blocks/Info';

export default class UsersManager extends Component {
    static displayName = UsersManager.name;

    constructor(props) {
        super(props);
        const { cls, school } = this.props.match.params;
        this.users = JSON.parse(sessionStorage.getItem("selectedUsers"));

        this.state = {
            cls: {
                name: "Klass " + cls,
                displayName: school,
                subTitle: `${this.users.length} elev${(this.users.length === 1 ? "" : "er")}`
            }
        }
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");
        if (token == null || token === undefined)
            this.props.history.push("/");


    }

    render() {
        const { cls } = this.state;

        return (
            <div className='interior-div'>
                <Info name={cls?.name} displayName={cls?.displayName} subTitle={cls?.subTitle} />

                <Form title={"Nya lösenord till " + this.users.length + " elev" + (this.users.length === 1 ? "" : "er")}
                    api="setPasswords"
                    users={this.users}
                    multiple={true}
                    buttonText="Verkställ" />
            </div>
        )
    }
}

