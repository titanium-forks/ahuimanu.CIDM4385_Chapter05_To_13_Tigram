exports.definition = {
	config: {

		adapter: {
			type: "acs",
			collection_name: "users"
		}
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, 
		{
			// extended functions and properties go here
			// it is a comma-seperated list of functions and properties
			/**
			 * log user in with username and password
			 * 
			 * @param {Object} _login
			 * @param {Object} _password
			 * @param {Object} _callback
			 */
			login: function(_login, _password, _callback)
			{
				var self = this;
				this.config.Cloud.Users.login(
					//remember, these curly-braced key-value pairs are JavaScript
					//object literals - they are usually what is sent as 
					//arguments to many methods in the API
					{
						login: _login,
						password: _password,
					}, function(e)
					{
						if(e.success){
							var user = e.users[0];
							
							//save session id
							Ti.App.Properties.setString('sessionId', e.meta.session_id);
							Ti.App.Properties.setString('user', JSON.stringify(user));
							
							//this syntax means: take the existing callback
							//and add the extra behavior/stuff
							_callback && _callback(
								{
									success : true,
									model: new model(user)
								}
							);
						} else {
							Ti.API.error(e);
							_callback && _callback(
								{
									success: false,
									model: null,
									error: e
								}
							);						
						}
					}
				);
			}, //end login

			/**
			 * Allows for the creation of a new user
			 *   
 		     * @param {Object} _ucerInfo
 			 * @param {Object} _callback
			 */
			createAccount: function(_ucerInfo, _callback)
			{
				var cloud = this.config.Cloud;
				var TAP = Ti.App.Properties;
				
				//if we detect bad data, return to caller
				if(!_userInfo)
				{
					_callback && _callback(
						{
							success: false,
							model: null
						}
					);
				} else {
					//we've got good user info
					cloud.Users.create(_userInfo, function(e){
						if(e.success)
						{
							var user = e.users[0];
							//set up persistent variables in the App's properties store
							TAP.setString("sessionId", e.meta.session_id);
							TAP.setString("user", JSON.stringify(user));
							
							//setting to allow ACS to track session id
							cloud.sessionId = e.meta.session_id;
							
							//callback with newly created user
							_callback && callback(
								{
									success: true,
									model: new model(user)
								}
							);
						} else {
							//no bueno
							Ti.API.error(e);
							__callback && _callback(
								{
									success: false,
									model: null,
									error: e
								}
							);
						}
					});
				}
			}, //end createAccount
			
			/**
			 * the ability for the user to logout 
             * @param {Object} _callback
			 */			
			logout: function(_callback)
			{
				var cloud = this.config.Cloud;
				var TAP = Ti.App.Properties;
				
				//e is the response populated by calling logout on ACS
				cloud.Users.logout(function(e)
					{
						//success is a property of the ACS user object
						if(e.success)
						{
							//the first element of the users array contains the current user
							var user = e.users[0];
							
							//unset these variables from the properties store - like session variables
							TAP.removeProperty("sessionId");
							TAP.removeProperty("user");
							
							//callback which clears out the user model
							_callback && _callback(
								{
									success: true,
									model: null
								}
							);
						} else {
							//no bueno
							Ti.API.error(e);
							
							//callback in case of error
							_callback && _callback(
								{
									success: false,
									model: null,
									error: e
								}
							);
						}
					}
				);
			}, //end logout
			
			/**
			 * this checks to see that the user is authenticated currently 
			 */
			authenticated: function()
			{
				var cloud = this.config.Cloud;
				var TAP = Ti.App.Properties;
				
				//check for success
				if(TAP.hasPropert("sessionId")){
					Ti.API.info("SESSION ID: " + TAP.getString("SessionId"));
					cloud.sessionId = TAP.getString("SessionId");
					return true;
				}
				
				//presume failure
				return false;
			},
			
			//shows who is currently logged in - who the user is - by sessionId
			showMe: function(_callback)
			{
				var cloud = this.config.Cloud;
				var TAP = Ti.App.Properties;
				
				cloud.Users.showMe(function(e)
					{
						if(e.success)
						{
							//this is the current user if we were able to successfully contact ACS with showMe
							var user = e.users[0];
							
							//set the properties variables
							TAP.setString("sessionId", e.meta.session_id);
							TAP.setString("user", JSON.stringify(user));
							
							//callback if successful
							_callback && _callback(
								{
									success: true,
									model: new model(user)
								}
							);
						} else {
							//no bueno
							Ti.App.error(e);
							
							TAP.removeProperty("sessionId");
							TAP.removeProperty("user");
							
							//call back in the case of "no bueno"
							_callback && _callback(
								{
									success: false,
									model: null,
									error: e
								}
							);
						}
					}
				);
			}, //end showMe
		});

		return Model;
	},
	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// extended functions and properties go here
		});

		return Collection;
	}
};