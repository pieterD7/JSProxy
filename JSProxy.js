/*
    JSProxy

    @author Pieter Hoekstra
*/

class JSProxy{

    constructor( obj, satisfy, type, cbValid, cbError) {

        this.cbValid = cbValid
        this.cbError = cbError

        if( type == 'tags'){
            return new Proxy( obj, Object.assign( {satisfy : satisfy}, this.handleTags, this ))
        }
        else if( type == 'types'){
            return new Proxy( obj, Object.assign( {satisfy : satisfy}, this.handleTypes, this ))
        }
    }

    errorOut = function( error ){

        if(this.cbError && typeof this.cbError == 'function')
            this.cbError( error )
    }

    onChange = function(){

        if(this.cbValid && typeof this.cbValid == 'function')
            this.cbValid( )
    }

    handleTags = {

        get: function( obj, prop){

            if( prop in obj && obj[ prop]  != null)
                return obj[ prop ]
            else{
                obj[ prop ] = document.createElement( this.satisfy[ prop ] )
                return obj[ prop ]
            }
        },
        set: function( obj, prop, value) { 

            if( value && value.tagName 
                && this.satisfy[ prop ]
                && value.tagName.toLowerCase() == this.satisfy[ prop ]){
            
                    obj[ prop ] = value
                    this.onChange()
                    return true
            }
            else{
                this.errorOut(
                    "Wrong tag (" + (value && value.tagName ? value.tagName : value) + ") " + 
                    "for property " + prop
                )
                return false
            }
        }
    }

    handleTypes = {

        isNull: ( value ) => {

            return value == 0 || value == null || value == ''
        },
        prepareCompares: (propReqs) => {

            let compare = []
            propReqs.map( ( val ) => {
                if( val.indexOf('>') > -1 ){
                    compare.push({cmp:'>', value:parseFloat( val.substring(1, val.length) )})
                }
                else if( val.indexOf('<') > -1){
                    compare.push({cmp:'<', value:parseFloat( val.substring(1, val.length))})
                }
                else if( val.indexOf('=') > -1){
                    compare.push({cmp:'=', value:parseFloat( val.substring(1, val.length))})
                }
            } );

            return compare
        },
        prepareNumber: ( compares, value ) => {

            let test = parseFloat( value )

            if( ! isNaN( test ))
                value = test
            if( compares.length > 0 && (! this.handleTypes.withinRange( compares, value) 
                || ! this.handleTypes.equality( compares, value))){
                
               this.errorOut( 'Not within range : ' + value )

                return false
            }
            return value
        },
        equality: (compares, value) => {

            let result = false,
                applicable = false;

            compares.forEach( ( cmp ) => {
                if( cmp.cmp == '='){
                    applicable = true
                    if( value == cmp.value)
                        result = true
                }
            })

            return ! applicable || result
        },
        withinRange: (compares, value) => {

            let result = true
            compares.forEach( (cmp) => {
                if( cmp.cmp == '<' && value > cmp.value)
                    result = false
                else if( cmp.cmp == '>' && value < cmp.value)
                    result = false
            })
            return result
        },
        getProps: (str) => {

            return JSON.parse(str)
        },
        satisfyObject: ( ob, val, props) => {

            let value = val,
                result = true;

            for( var prop in props){

                if( typeof props[ prop ] != 'object'){

                    let propReqs =  this.handleTypes.getPropReqs( props, prop)

                    let compares = this.handleTypes.prepareCompares( propReqs )
    
                    let value2

                    if( propReqs.indexOf('number') > -1)
                        value2 = this.handleTypes.prepareNumber( compares, value[ prop ] )
                    else
                        value2 = value[ prop ]

                    if( ! this.handleTypes.canAssignValue( 
                            value2, 
                            this.handleTypes.startsWithCapital( prop ), 
                            this.handleTypes.getPropReqs(props, prop), 
                            prop))

                        result = false
                }
                else{
                    this.handleTypes.satisfyObject( ob, val[ prop ], props[ prop ])
                }
            }

            return result
        },
        startsWithCapital: ( str ) => {

            return str[0] == str[0].toUpperCase()
        },
        getPropReqs: ( satisfy, prop ) => {

            return  satisfy[ prop ]?  satisfy[ prop ].split( '|' ) : []
        },
        canAssignValue: ( value, checkInstance, propReqs, prop) => {
            
            // What???!!! an ugly eval is needed! Better do a check for some decency.
            if( checkInstance  && ! this.satisfy[ prop ].match(/\W/)){
                if( ! (value instanceof eval( this.satisfy[ prop ] ))){
                 
                    this.errorOut( value + ' is not instance of ' + this.satisfy[ prop ] )

                    return false
                }
            }
            else if( propReqs.indexOf( typeof value ) == -1 
                || value == null
                || (propReqs.indexOf( 'notNull' )  == 1 
                    && this.isNull( value ))){
                
                this.errorOut( 'Value ' + value + ' cannot be assigned to ' + prop )
                
                return false
            }
            
            return true
        },
        set : function( obj, prop, value) {

            var propReqs = this.getPropReqs( this.satisfy, prop ),
                compare = [],
                checkInstance = false;


            if( ! this.satisfy[ prop ]){
                obj[ prop ] = value
                return true
            }

            if( this.satisfy[ prop ].match(/^object/) ){
                var str = this.satisfy[ prop ],
                    json = str.substring( str.indexOf('{'), str.length)

                if( this.satisfyObject( prop, value, this.getProps( json )) ){
                    obj[ prop ] = value
                    this.onChange()
                    return true
                }
                else
                    return false
            }
                
            compare = this.prepareCompares( propReqs)

            if( this.satisfy[ prop ])
                checkInstance = this.startsWithCapital( this.satisfy[ prop ] )

            if( propReqs.indexOf( 'number' ) == 0){
                value = this.prepareNumber( compare, value)
            }

            if( this.canAssignValue( value, checkInstance, propReqs, prop)){
                obj[ prop ] = value
                this.onChange()
                return true
            }
            else{
                return false
            }

        }
    }

}